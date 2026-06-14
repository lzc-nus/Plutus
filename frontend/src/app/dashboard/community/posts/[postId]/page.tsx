"use client";

import { use } from "react";
import { PostDetail } from "@/components/dashboard/community/PostDetail";

interface PostPageProps {
  params: Promise<{ postId: string }>;
}

export default function PostPage({ params }: PostPageProps) {
  const { postId } = use(params);
  return <PostDetail postId={postId} />;
}