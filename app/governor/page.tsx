import TwoPaneMapPage from "../../components/TwoPaneMapPage";

export default function GovernorPage() {
  return (
    <TwoPaneMapPage
      level="governor"
      title="1) 시·도지사 (광역자치단체장)"
      geoUrl="/data/governor.geojson"
      regionsUrl="/data/regions-governor.json"
      pastResultsCsvUrl="/data/past-results-governor.csv"
      candidatesCsvUrl="/data/candidates-governor.csv"
      urlKey="g"
    />
  );
}
