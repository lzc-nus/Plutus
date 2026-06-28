"use client";

<<<<<<< HEAD
import { use } from "react";
import { PostDetail } from "@/components/dashboard/community/PostDetail";
=======
import { use, useState } from "react";
import { PostDetail } from "@/components/community/PostDetail";
import { AuthRequiredDialog } from "@/components/community/AuthRequiredDialog";
import { useAuth } from "@/lib/hooks/useAuth";
>>>>>>> 960af32b2963319ba21f279510541e91d5049988

interface PostPageProps {
  params: Promise<{ postId: string }>;
}

export default function PostPage({ params }: PostPageProps) {
  const { postId } = use(params);
<<<<<<< HEAD
  return <PostDetail postId={postId} />;
}
=======
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
>>>>>>> 960af32b2963319ba21f279510541e91d5049988
