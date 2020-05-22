import React from "react";
import { Route, Switch } from "react-router-dom";
import Contribute from "../contribute/contribute";
import Settings from "../settings/settings";
import Home from "../home/home";

export default function Routes() {
  return (
    <Switch>
      <Route exact path="/" component={Home} />
      <Route exact path="/contribute" component={Contribute} />
      <Route exact path="/settings" component={Settings} />
    </Switch>
  );
}