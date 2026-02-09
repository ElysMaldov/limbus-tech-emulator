import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("crane", "routes/crane.tsx"),
  route("conveyor", "routes/conveyor.tsx"),
  route("assembly-line", "routes/assembly-line.tsx"),
  route("challenge-01", "routes/challenge-01.tsx"),
  route("challenge-02", "routes/challenge-02.tsx"),
  route("crane-factory", "routes/crane-factory.tsx"),
  route("machine-hierarchy", "routes/machine-hierarchy.tsx"),
] satisfies RouteConfig;
