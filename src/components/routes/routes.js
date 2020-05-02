import React from "react";
import { Route, Switch } from "react-router-dom";
import Create from '../create/create'
import Home from "../home/home";

export default function Routes() {
  return (
    <Switch>
      <Route exact path="/" component={Home} />
      {/* <Route exact path="/contribute" component={Contribute} /> */}
    </Switch>
  );
}