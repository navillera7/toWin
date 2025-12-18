import TwoPaneMapPage from "../../components/TwoPaneMapPage";

export default function SigunguPage() {
  return (
    <TwoPaneMapPage
      level="sigungu"
      title="2) 시·군·구 (기초자치단체장)"
      geoUrl="/data/sigungu-basic.geojson"
      regionsUrl="/data/regions-sigungu-basic.json"
      pastResultsCsvUrl="/data/past-results-sigungu.csv"
      candidatesCsvUrl="/data/candidates-sigungu.csv"      urlKey="s"
    />
  );
}
