import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { selectors } from "ui/reducers";
import { sortBy } from "lodash";
import hooks from "ui/hooks";

import AddCommentButton from "ui/components/Transcript/AddCommentButton";
import TranscriptItem from "ui/components/Transcript/TranscriptItem";
import TranscriptFilter from "ui/components/Transcript/TranscriptFilter";
const CommentThread = require("ui/components/Comments/CommentThread").default;
const { getFilenameFromURL } = require("devtools/client/debugger/src/utils/sources-tree/getURL");
import "./Transcript.css";

import { UIState } from "ui/state";
import { Event, PendingComment, Comment } from "ui/state/comments";
import { ViewMode } from "ui/state/app";

function createEntries(
  comments: Comment[],
  clickEvents: Event[],
  viewMode: ViewMode,
  shouldShowLoneEvents: boolean
) {
  let entries = clickEvents.map(event => ({ ...event }));
  const nonNestedComments = comments.reduce((acc: Comment[], comment: Comment) => {
    const matchingEntryIndex = entries.findIndex(entry => entry.point == comment.point);
    if (matchingEntryIndex >= 0) {
      entries[matchingEntryIndex].comment = comment;
      return acc;
    } else {
      return [...acc, comment];
    }
  }, []);

  // If lone events are supposed to be hidden, filter them out.
  if (!shouldShowLoneEvents) {
    entries = entries.filter(entry => entry.comment);
  }

  return [...entries, ...nonNestedComments];
}

function Transcript({
  recordingId,
  clickEvents,
  pendingComment,
  viewMode,
  shouldShowLoneEvents,
}: PropsFromRedux) {
  const { comments } = hooks.useGetComments(recordingId!);

  let entries: (Comment | Event | PendingComment)[] = createEntries(
    comments,
    clickEvents,
    viewMode,
    shouldShowLoneEvents
  );

  if (pendingComment && !pendingComment.id) {
    // New comments that haven't been sent to Hasura will not have an associated ID.
    // They're not included in the comments data from the query, so we have to insert
    // them manually here. If a pending comment has an ID, it already exists in the
    // comments data and we don't have to insert it.
    entries = [...entries, pendingComment];
  }

  return (
    <div className="right-sidebar">
      <div className="right-sidebar-toolbar">
        <div className="right-sidebar-toolbar-item">Transcript and Comments</div>
        <TranscriptFilter />
      </div>
      <div className="transcript-panel">
        <AddCommentButton />
        <div className="transcript-list">
          {sortBy(entries, ["time", "kind", "created_at"]).map((entry, i) => {
            if ("content" in entry) {
              return <CommentTranscriptItem comment={entry} key={i} />;
            } else {
              return <EventTranscriptItem event={entry} key={i} />;
            }
          })}
        </div>
      </div>
    </div>
  );
}

function EventTranscriptItem({ event }: { event: Event }) {
  return (
    <TranscriptItem
      item={event}
      icon={<div className="img event-click" />}
      label="Mouse Click"
      secondaryLabel=""
    >
      {event.comment ? <CommentThread comment={event.comment} /> : null}
    </TranscriptItem>
  );
}

function CommentTranscriptItem({ comment }: { comment: Comment | PendingComment }) {
  if (comment.content == "") {
    return (
      <TranscriptItem
        item={comment}
        icon={<div className="img pencil-sm" />}
        label="Adding comment"
        secondaryLabel=""
      >
        <CommentThread comment={comment} />
      </TranscriptItem>
    );
  }

  let icon = "chat-alt";
  let label = "Comment";
  let secondaryLabel = "";

  if (comment.source_location) {
    const filename = getFilenameFromURL(comment.source_location.sourceUrl);
    icon = "document-text";
    label = `${filename}:${comment.source_location.line}`;
    secondaryLabel = ``;
  }

  return (
    <TranscriptItem
      item={comment}
      icon={<div className={`img ${icon}`} />}
      label={label}
      secondaryLabel={secondaryLabel}
    >
      <CommentThread comment={comment} />
    </TranscriptItem>
  );
}

const connector = connect((state: UIState) => ({
  recordingId: selectors.getRecordingId(state),
  clickEvents: selectors.getEventsForType(state, "mousedown"),
  pendingComment: selectors.getPendingComment(state),
  viewMode: selectors.getViewMode(state),
  shouldShowLoneEvents: selectors.getShouldShowLoneEvents(state),
}));
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(Transcript);
