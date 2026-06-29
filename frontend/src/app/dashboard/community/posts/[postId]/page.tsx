"use client";

import { use, useState } from "react";
import { PostDetail } from "@/components/community/PostDetail";
import { AuthRequiredDialog } from "@/components/community/AuthRequiredDialog";
import { useAuth } from "@/lib/hooks/useAuth";

interface PostPageProps {
  params: Promise<{ postId: string }>;
}

export default function PostPage({ params }: PostPageProps) {
  const { postId } = use(params);
  const { user } = useAuth();
  const [authAction, setAuthAction] = useState<string | null>(null);

  return (
    <>
      <PostDetail
        postId={postId}
        viewer={user}
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
