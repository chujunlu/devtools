import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { ValueFront } from "protocol/thread";
const { actions } = require("ui/actions");
const reps = require("devtools/client/debugger/packages/devtools-reps/src");
const { REPS, MODE } = reps;
const ObjectInspector = reps.objectInspector.ObjectInspector.default;
const SmartTrace = require("devtools/client/webconsole/utils/connected-smart-trace").default;

type ObjectInspectorProps = PropsFromRedux & {
  value: ValueFront;
  useQuotes: boolean;
  transformEmptyString: boolean;
  escapeWhitespace: boolean;
  style: React.CSSProperties;
};

function OI(props: ObjectInspectorProps) {
  const { value } = props;
  const path = value.id();
  const roots = [{ path, contents: value }];

  return (
    <ObjectInspector
      {...props}
      autoExpandDepth={0}
      mode={MODE.LONG}
      defaultRep={REPS.Grip}
      roots={roots}
      renderStacktrace={renderStacktrace}
    />
  );
}

function onInspectIconClick(object: ValueFront, e: React.MouseEvent) {
  e.stopPropagation();
  return actions.openNodeInInspector(object);
}

function renderStacktrace(stacktrace: any) {
  return <SmartTrace key="stacktrace" stacktrace={stacktrace} />;
}

const connector = connect(null, {
  onViewSourceInDebugger: actions.onViewSourceInDebugger,
  openLink: actions.openLink,
  onDOMNodeMouseOver: actions.highlightDomElement,
  onDOMNodeMouseOut: actions.unHighlightDomElement,
  onInspectIconClick,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(OI);
