import React from "react";
import { Route, BrowserRouter } from "react-router-dom";

import Home from "./pages/Home";
import CreatePoint from "./pages/CreatePoint";

const Routes = () => {
  return (
    <BrowserRouter>
      <Route path="/" exact={true} component={Home} />
      <Route path="/create-point" component={CreatePoint} />
    </BrowserRouter>
  );
};

export default Routes;
