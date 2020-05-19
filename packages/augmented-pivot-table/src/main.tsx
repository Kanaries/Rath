import React from "react";
import ReactDOM from "react-dom";
import App from "./app";
function Page () {
  return (
    <div>
      <div className="ui secondary pointing menu">
        <div className="ui item">
          <img
            style={{ width: "48px" }}
            src="https://ch-resources.oss-cn-shanghai.aliyuncs.com/images/kanaries-lite.png"
            alt=""
          />
          <h3 className="ui header" style={{ color: "#d43317" }}>
            Kanaries
          </h3>
        </div>
        <div className="ui item" style={{ marginBottom: "2px" }}>
          Augmented Pivot Table
        </div>
        <div className="right menu">
          <a className="ui item" href="https://github.com/Kanaries/Rath">
            <i className="big github icon"></i>
          </a>
        </div>
      </div>
      <div className="ui padded container">
        <App />
      </div>
    </div>
  );
}
ReactDOM.render(<Page />, document.getElementById("root"));
