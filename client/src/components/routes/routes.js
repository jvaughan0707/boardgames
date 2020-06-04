import React from "react";
import { Route, Switch } from "react-router-dom";
import Settings from "../settings/settings";
import Home from "../home/home";

export default function Routes() {
  return (
    <Switch>
      <Route exact path="/" component={Home} />
      <Route exact path="/settings" component={Settings} />
    </Switch>
  );
}