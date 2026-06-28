"use client";

import { use, useState } from "react";
import { AuthRequiredDialog } from "@/components/community/AuthRequiredDialog";
import { PostDetail } from "@/components/community/PostDetail";
import { useOptionalViewer } from "@/lib/hooks/useOptionalViewer";

interface PublicPostPageProps {
  params: Promise<{ postId: string }>;
}

export default function PublicPostPage({ params }: PublicPostPageProps) {
  const { postId } = use(params);
  const { viewer } = useOptionalViewer();
  const [authAction, setAuthAction] = useState<string | null>(null);

  return (
    <>
      <PostDetail
        postId={postId}
        viewer={viewer}
        onAuthRequired={setAuthAction}
      />
      {authAction && (
        <AuthRequiredDialog
          action={authAction}
          onClose={() => setAuthAction(null)}
        />
      )}
    </>
  );
}
