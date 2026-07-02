"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DragDropProvider,
  type DragEndEvent,
  type DragOverEvent,
  useDroppable
} from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { move } from "@dnd-kit/helpers";
import { GripVertical, Plus, Search, Shuffle, X } from "lucide-react";
import {
  groupAssignmentStatus,
  moveTeamToGroup,
  randomizeGroupAssignments,
  swapGroupTeams
} from "@/lib/league";
import type { Group, Team } from "@/types/league";
import styles from "@/app/page.module.css";

const UNASSIGNED = "unassigned";

type AssignmentItems = Record<string, string[]>;

type Props = {
  teams: Team[];
  groups: Group[];
  teamsPerGroup: number;
  onGroupsChange: (groups: Group[]) => Promise<void>;
};

type SwapRequest = {
  incomingTeamId: string;
  destinationGroupId: string;
};

function buildItems(teams: Team[], groups: Group[]): AssignmentItems {
  const assigned = new Set(groups.flatMap((group) => group.teamIds));
  return {
    [UNASSIGNED]: teams.filter((team) => !assigned.has(team.id)).map((team) => team.id),
    ...Object.fromEntries(groups.map((group) => [group.id, [...group.teamIds]]))
  };
}

function destinationGroupId(items: AssignmentItems, targetId: string | number | null | undefined) {
  if (targetId == null) return null;
  const id = String(targetId);
  if (id in items) return id;
  return Object.keys(items).find((groupId) => items[groupId].includes(id)) ?? null;
}

export default function GroupAssignmentBoard({
  teams,
  groups,
  teamsPerGroup,
  onGroupsChange
}: Props) {
  const [items, setItems] = useState<AssignmentItems>(() => buildItems(teams, groups));
  const itemsRef = useRef(items);
  const [message, setMessage] = useState("");
  const [quickGroupId, setQuickGroupId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [swapRequest, setSwapRequest] = useState<SwapRequest | null>(null);
  const dragOriginRef = useRef<string | null>(null);

  useEffect(() => {
    const nextItems = buildItems(teams, groups);
    itemsRef.current = nextItems;
    setItems(nextItems);
  }, [teams, groups]);

  const teamById = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams]
  );
  const currentGroups = useMemo(
    () => groups.map((group) => ({ ...group, teamIds: items[group.id] ?? [] })),
    [groups, items]
  );
  const status = useMemo(
    () => groupAssignmentStatus(teams, currentGroups, teamsPerGroup),
    [teams, currentGroups, teamsPerGroup]
  );

  async function persistItems(nextItems: AssignmentItems) {
    itemsRef.current = nextItems;
    setItems(nextItems);
    await onGroupsChange(
      groups.map((group) => ({
        ...group,
        teamIds: nextItems[group.id] ?? []
      }))
    );
  }

  function handleDragOver(event: DragOverEvent) {
    const sourceId = String(event.operation.source?.id ?? "");
    const targetId = event.operation.target?.id;
    if (!sourceId || targetId == null) return;

    const current = itemsRef.current;
    const origin = dragOriginRef.current;
    const destination = destinationGroupId(current, targetId);

    if (
      destination &&
      destination !== UNASSIGNED &&
      destination !== origin &&
      (current[destination]?.length ?? 0) >= teamsPerGroup
    ) {
      event.preventDefault();
      return;
    }

    const next = move(current, event) as AssignmentItems;
    itemsRef.current = next;
    setItems(next);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const sourceId = String(event.operation.source?.id ?? "");
    const targetId = event.operation.target?.id;
    const origin = dragOriginRef.current;
    dragOriginRef.current = null;

    if (event.canceled || !sourceId || targetId == null) {
      const reset = buildItems(teams, groups);
      itemsRef.current = reset;
      setItems(reset);
      return;
    }

    const baseItems = buildItems(teams, groups);
    const destination = destinationGroupId(baseItems, targetId);
    if (
      destination &&
      destination !== UNASSIGNED &&
      destination !== origin &&
      (baseItems[destination]?.length ?? 0) >= teamsPerGroup
    ) {
      setSwapRequest({ incomingTeamId: sourceId, destinationGroupId: destination });
      itemsRef.current = baseItems;
      setItems(baseItems);
      return;
    }

    const next = move(itemsRef.current, event) as AssignmentItems;
    setMessage("");
    await persistItems(next);
  }

  async function quickAssign(teamId: string, groupId: string) {
    const result = moveTeamToGroup(currentGroups, teamId, groupId, items[groupId]?.length ?? 0, teamsPerGroup);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setQuickGroupId(null);
    setSearch("");
    setMessage("");
    await persistItems(buildItems(teams, result.groups));
  }

  async function randomAssign() {
    const result = randomizeGroupAssignments(teams, currentGroups, teamsPerGroup);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setMessage("Teams were distributed randomly. Review every group before generating fixtures.");
    await persistItems(buildItems(teams, result.groups));
  }

  async function confirmSwap(replacedTeamId: string) {
    if (!swapRequest) return;
    const result = swapGroupTeams(currentGroups, swapRequest.incomingTeamId, replacedTeamId);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setSwapRequest(null);
    setMessage("Teams swapped successfully.");
    await persistItems(buildItems(teams, result.groups));
  }

  const availableTeams = items[UNASSIGNED]
    .map((teamId) => teamById.get(teamId))
    .filter((team): team is Team => Boolean(team))
    .filter((team) => team.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const quickGroup = groups.find((group) => group.id === quickGroupId);
  const swapGroup = groups.find((group) => group.id === swapRequest?.destinationGroupId);
  const incomingTeam = swapRequest ? teamById.get(swapRequest.incomingTeamId) : null;

  return (
    <section className={styles.assignmentSection} aria-labelledby="group-assignment-title">
      <div className={styles.assignmentHeader}>
        <div>
          <p className={styles.eyebrow}>Group Stage</p>
          <h3 id="group-assignment-title">Group Assignment</h3>
          <p>
            {status.assignedCount}/{teams.length} assigned · {status.unassignedTeamIds.length} unassigned
          </p>
        </div>
        <button className={styles.secondaryButton} onClick={() => void randomAssign()}>
          <Shuffle size={16} />
          Random assign
        </button>
      </div>

      <div className={`${styles.assignmentStatus} ${status.isComplete ? styles.assignmentComplete : ""}`}>
        {status.isComplete
          ? "Complete — every group is full and every team is assigned once."
          : "Assign every team and fill every group before generating fixtures."}
      </div>
      {message && <p className={styles.assignmentMessage}>{message}</p>}

      <DragDropProvider
        onDragStart={(event) => {
          dragOriginRef.current = destinationGroupId(itemsRef.current, event.operation.source?.id);
        }}
        onDragOver={handleDragOver}
        onDragEnd={(event) => void handleDragEnd(event)}
      >
        <div className={styles.assignmentBoard}>
          <AssignmentList
            id={UNASSIGNED}
            title="Unassigned"
            subtitle={`${items[UNASSIGNED].length} teams`}
            teamIds={items[UNASSIGNED]}
            teamById={teamById}
          />
          {groups.map((group) => {
            const count = items[group.id]?.length ?? 0;
            const remaining = teamsPerGroup - count;
            const isFull = remaining === 0;
            return (
              <AssignmentList
                key={group.id}
                id={group.id}
                title={`${group.label} (${count}/${teamsPerGroup})`}
                subtitle={isFull ? "Full — move or swap teams" : `${remaining} slot${remaining === 1 ? "" : "s"} left`}
                teamIds={items[group.id] ?? []}
                teamById={teamById}
                full={isFull}
                action={
                  <button
                    className={styles.groupAddButton}
                    disabled={isFull || items[UNASSIGNED].length === 0}
                    onClick={() => {
                      setQuickGroupId(group.id);
                      setSearch("");
                    }}
                  >
                    <Plus size={15} />
                    Add team
                  </button>
                }
              />
            );
          })}
        </div>
      </DragDropProvider>

      {quickGroup && (
        <div className={styles.modalOverlay} role="presentation">
          <section className={styles.confirmDialog} role="dialog" aria-modal="true" aria-labelledby="quick-assign-title">
            <button className={styles.modalCloseButton} aria-label="Close assignment selector" onClick={() => setQuickGroupId(null)}>
              <X size={18} />
            </button>
            <h2 id="quick-assign-title">Add team to {quickGroup.label}</h2>
            <label className={styles.assignmentSearch}>
              <Search size={17} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search teams" autoFocus />
            </label>
            <div className={styles.assignmentPicker}>
              {availableTeams.map((team) => (
                <button key={team.id} onClick={() => void quickAssign(team.id, quickGroup.id)}>
                  {team.name}
                </button>
              ))}
              {availableTeams.length === 0 && <p>No matching unassigned teams.</p>}
            </div>
          </section>
        </div>
      )}

      {swapRequest && swapGroup && incomingTeam && (
        <div className={styles.modalOverlay} role="presentation">
          <section className={styles.confirmDialog} role="dialog" aria-modal="true" aria-labelledby="swap-title">
            <h2 id="swap-title">Swap into {swapGroup.label}</h2>
            <p>{swapGroup.label} is full. Choose the team that {incomingTeam.name} should replace.</p>
            <div className={styles.assignmentPicker}>
              {(items[swapGroup.id] ?? []).map((teamId) => (
                <button key={teamId} onClick={() => void confirmSwap(teamId)}>
                  Swap with {teamById.get(teamId)?.name ?? "team"}
                </button>
              ))}
            </div>
            <button className={styles.secondaryButton} onClick={() => setSwapRequest(null)}>
              Cancel
            </button>
          </section>
        </div>
      )}
    </section>
  );
}

function AssignmentList({
  id,
  title,
  subtitle,
  teamIds,
  teamById,
  full = false,
  action
}: {
  id: string;
  title: string;
  subtitle: string;
  teamIds: string[];
  teamById: Map<string, Team>;
  full?: boolean;
  action?: React.ReactNode;
}) {
  const { ref, isDropTarget } = useDroppable({ id, data: { groupId: id } });

  return (
    <article
      ref={ref}
      className={`${styles.assignmentGroup} ${full ? styles.assignmentGroupFull : ""} ${
        isDropTarget ? styles.assignmentDropTarget : ""
      }`}
    >
      <header>
        <div>
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>
        {action}
      </header>
      <div className={styles.assignmentTeamList}>
        {teamIds.map((teamId, index) => (
          <SortableTeam key={teamId} team={teamById.get(teamId)} groupId={id} index={index} />
        ))}
        {teamIds.length === 0 && <div className={styles.assignmentEmpty}>Drop teams here</div>}
      </div>
    </article>
  );
}

function SortableTeam({
  team,
  groupId,
  index
}: {
  team?: Team;
  groupId: string;
  index: number;
}) {
  const { ref, handleRef, isDragging, isDropTarget } = useSortable({
    id: team?.id ?? `missing-${groupId}-${index}`,
    index,
    group: groupId,
    type: "team",
    data: { teamId: team?.id, groupId }
  });

  if (!team) return null;

  return (
    <div
      ref={ref}
      className={`${styles.assignmentTeam} ${isDragging ? styles.assignmentTeamDragging : ""} ${
        isDropTarget ? styles.assignmentTeamTarget : ""
      }`}
    >
      <button ref={handleRef} className={styles.dragHandle} aria-label={`Drag ${team.name}`}>
        <GripVertical size={17} />
      </button>
      <strong>{team.name}</strong>
    </div>
  );
}
