import React from "react";
import { Route, Switch } from "react-router-dom";
import Contribute from "../contribute/contribute";
import Home from "../home/home";

export default function Routes() {
  return (
    <Switch>
      <Route exact path="/" component={Home} />
      <Route exact path="/contribute" component={Contribute} />
    </Switch>
  );
}