
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie,Legend,Cell,
  
} from "recharts";

const xvalue = [10, 20, 30, 40, 50];
const yvalue = [15, 25, 35, 45, 55];

const data = xvalue.map((x, i) => ({ x, y: yvalue[i] }));


const pieData = data.map((item, index) => ({
  name: `use ${index + 1}`,
  value: item.y
}));

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f7f", "#8dd1e1"];

function Graphs({ type }) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>


        {type === "line" && (
          <LineChart data={data}>
            <CartesianGrid stroke="#ccc" />
            <XAxis dataKey="x" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="y" stroke="#0e0d18" />
          </LineChart>
        )}

        {type === "bar" && (
          <BarChart data={data}>
            <CartesianGrid stroke="#ccc" />
            <XAxis dataKey="x" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="y" fill="#8884d8" />
          </BarChart>
        )}

        
        {type === "pie" && (
          <PieChart>
            <Tooltip />
            <Legend />
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius={30}
              outerRadius={100}
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        )}

      </ResponsiveContainer>
    </div>
  );
}

export default Graphs;