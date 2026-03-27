"use client";

import { FoldersSettings } from "~/app/_components/settings/folders-settings";
import { TagsSettings } from "~/app/_components/settings/tags-settings";

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-text-primary)]">
        Settings
      </h1>

      <div className="flex flex-col gap-6">
        <FoldersSettings />
        <TagsSettings />
      </div>
    </div>
  );
}
