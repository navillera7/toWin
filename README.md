# Korea Local Elections Map (2-level)

- 1페이지: 시·도지사(광역)
- 2페이지: 시·군·구(기초)

## 실행
```bash
npm install
npm run dev
```

## 지도 데이터
- `public/data/governor.geojson` : 시·도 경계 (Feature.properties.id/name 포함)
- `public/data/sigungu.geojson` : 시·군·구 경계 (Feature.properties.id/name 포함)

## 과거 결과 입력 (hover에 표시)
아래 CSV를 네가 직접 채우면, 커서를 지역 위에 올렸을 때 과거 결과가 뜹니다.

- `public/data/past-results-governor.csv`
- `public/data/past-results-sigungu.csv`

CSV 컬럼:
`year, level, region_id, region_name, winner_party, winner_name, vote_share, margin, notes`

- level 값은 `governor` 또는 `sigungu` 로 맞춰주세요.
- region_id 는 지도 hover에 뜨는 코드 그대로 사용.

## 선택 결과 CSV 다운로드
각 페이지 상단의 **"선택 결과 CSV 다운로드"** 버튼을 누르면,
현재 선택(색칠) 상태가 CSV로 내려받아집니다.


## 후보자 추가
- `public/data/candidates-governor.csv`
- `public/data/candidates-sigungu.csv`

컬럼:
`year, level, region_id, region_name, candidate_name, party, incumbent, profile_url, notes`

해당 지역에 커서를 올리면 우측 패널에 후보자 목록이 표시됩니다.
