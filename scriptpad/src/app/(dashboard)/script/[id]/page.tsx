"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import { EditorSkeleton } from "~/app/_components/editor/editor-skeleton";

const ScriptEditorPage = dynamic(
  () =>
    import("~/app/_components/editor/script-editor-page").then((m) => ({
      default: m.ScriptEditorPage,
    })),
  {
    loading: () => <EditorSkeleton />,
    ssr: false,
  },
);

export default function ScriptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <ScriptEditorPage scriptId={id} />;
}
