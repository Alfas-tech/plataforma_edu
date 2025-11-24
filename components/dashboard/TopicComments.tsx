import React from "react";
import { TopicCommentsClient } from "./TopicComments.client";

export default function TopicComments({ topicId }: { topicId: string }) {
  return <TopicCommentsClient topicId={topicId} />;
}
