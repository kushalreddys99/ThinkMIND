import React from "react";
import "./overview.css";


function Overview() {
  return (
    <div className="overview-page">
      <h1>Overview Page</h1>
      <p>This is the overview page content.</p>
      <table  className="overview-table" style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th>no.</th>
          <th>users</th>
          <th>feedback</th>
          <th>rating</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>abc</td>
          <td>hi</td>
          <td>5</td>
        </tr>
        <tr>
          <td>2</td>
          <td>sdfa</td>
          <td>hi</td>
          <td>4</td>
        </tr>
        <tr>
          <td>3</td>
          <td>xyz</td>
          <td>hello</td>
          <td>3</td>
        </tr>
      </tbody>
    </table>
 
    </div>
  );
}


export default Overview;