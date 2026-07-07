"use client";

import { useEffect, useRef, useState } from "react";
import { Shield, X } from "lucide-react";
import { createTeamGradient, teamColorPresets } from "@/lib/league";
import type { Team } from "@/types/league";
import styles from "./TeamDialog.module.css";

export type TeamDraft = {
  name: string;
  primaryColor: string;
  secondaryColor: string;
};

type TeamDialogProps = {
  team?: Team;
  teamIndex: number;
  existingTeams: Team[];
  onSave: (draft: TeamDraft) => Promise<void>;
  onClose: () => void;
};

const CLOSE_ANIMATION_MS = 160;

function normalizedName(name: string) {
  return name.trim().toLocaleLowerCase();
}

export default function TeamDialog({
  team,
  teamIndex,
  existingTeams,
  onSave,
  onClose
}: TeamDialogProps) {
  const fallback = teamColorPresets[teamIndex % teamColorPresets.length];
  const [name, setName] = useState(team?.name ?? "");
  const [primaryColor, setPrimaryColor] = useState(team?.primaryColor ?? fallback.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(team?.secondaryColor ?? fallback.secondaryColor);
  const [addAnother, setAddAnother] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(team);

  function requestClose() {
    if (isSaving || isClosing) return;
    setIsClosing(true);
    window.setTimeout(onClose, CLOSE_ANIMATION_MS);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") requestClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Enter a team name.");
      nameInputRef.current?.focus();
      return;
    }

    const duplicate = existingTeams.some(
      (existingTeam) =>
        existingTeam.id !== team?.id && normalizedName(existingTeam.name) === normalizedName(trimmedName)
    );

    if (duplicate) {
      setError("A team with this name already exists.");
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      await onSave({ name: trimmedName, primaryColor, secondaryColor });

      if (!isEditing && addAnother) {
        setName("");
        window.requestAnimationFrame(() => nameInputRef.current?.focus());
      } else {
        setIsClosing(true);
        window.setTimeout(onClose, CLOSE_ANIMATION_MS);
      }
    } catch {
      setError(`Could not ${isEditing ? "update" : "add"} the team. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className={`${styles.overlay} ${isClosing ? styles.overlayClosing : ""}`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <form
        className={`${styles.dialog} ${isClosing ? styles.dialogClosing : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-dialog-title"
        aria-describedby={error ? "team-dialog-error" : undefined}
        onSubmit={handleSubmit}
      >
        <header className={styles.header}>
          <div>
            <span>{isEditing ? "Team settings" : "Tournament setup"}</span>
            <h2 id="team-dialog-title">{isEditing ? "Edit team" : "Add team"}</h2>
          </div>
          <button type="button" className={styles.closeButton} aria-label="Close team dialog" onClick={requestClose}>
            <X size={18} />
          </button>
        </header>

        <label className={styles.field}>
          <span>Team Name</span>
          <input
            ref={nameInputRef}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError("");
            }}
            placeholder="e.g. Northside United"
            autoComplete="off"
            autoFocus
            aria-invalid={Boolean(error)}
          />
        </label>

        <div className={styles.colorFields}>
          <label className={styles.colorField}>
            <span>Primary Color</span>
            <span className={styles.colorControl}>
              <input
                type="color"
                value={primaryColor}
                onChange={(event) => setPrimaryColor(event.target.value)}
                aria-label="Primary team color"
              />
              <code>{primaryColor.toUpperCase()}</code>
            </span>
          </label>
          <label className={styles.colorField}>
            <span>Secondary Color</span>
            <span className={styles.colorControl}>
              <input
                type="color"
                value={secondaryColor}
                onChange={(event) => setSecondaryColor(event.target.value)}
                aria-label="Secondary team color"
              />
              <code>{secondaryColor.toUpperCase()}</code>
            </span>
          </label>
        </div>

        <div
          className={styles.preview}
          style={{ background: createTeamGradient(primaryColor, secondaryColor) }}
          aria-label="Live team gradient preview"
        >
          <Shield size={22} />
          <span>{name.trim() || "Your team"}</span>
          <small>Live preview</small>
        </div>

        <div className={styles.presets} aria-label="Team color presets">
          {teamColorPresets.map((preset) => (
            <button
              type="button"
              key={preset.name}
              style={{ background: createTeamGradient(preset.primaryColor, preset.secondaryColor) }}
              title={`Use ${preset.name} colors`}
              aria-label={`Use ${preset.name} colors`}
              onClick={() => {
                setPrimaryColor(preset.primaryColor);
                setSecondaryColor(preset.secondaryColor);
              }}
            />
          ))}
        </div>

        {!isEditing && (
          <label className={styles.checkboxRow}>
            <input type="checkbox" checked={addAnother} onChange={(event) => setAddAnother(event.target.checked)} />
            <span>
              <strong>Add another team</strong>
              <small>Keep this window open after saving</small>
            </span>
          </label>
        )}

        <div className={styles.messageSlot} aria-live="polite">
          {error && <p id="team-dialog-error">{error}</p>}
        </div>

        <footer className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={requestClose} disabled={isSaving}>
            Cancel
          </button>
          <button type="submit" className={styles.saveButton} disabled={isSaving}>
            {isSaving ? "Saving…" : isEditing ? "Save changes" : "Save team"}
          </button>
        </footer>
      </form>
    </div>
  );
}
