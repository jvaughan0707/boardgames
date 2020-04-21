import React from "react";
import { Route, Switch } from "react-router-dom";
import Home from "../home/home";
import Create from '../create/create'

export default function Routes() {
  return (
    <Switch>
      <Route exact path="/" component={Home} />
      <Route exact path="/create" component={Create} />
    </Switch>
  );
}