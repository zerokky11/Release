(function () {
  const staticAssetVersion = '3.0-20260826.1';
  const sharedParamNote = '공유파라미터 목록은 Revit 관리 > 공유 매개변수에 연결된 TXT를 기준으로 읽습니다. 홈페이지/Hub에서 TXT 파일을 별도로 선택하는 흐름은 없습니다.';
  const multiExportNote = '여러 RVT는 실행 전에 저장 방식을 정합니다. 실행 후 직접 저장은 결과를 화면에 남겨 사용자가 내보내고, 기능별 통합 Excel 순차 저장은 기능마다 통합 파일 하나를 만들며, RVT별 Excel 즉시 저장은 문서가 끝날 때마다 파일을 저장하고 메모리에서 결과를 해제합니다. 파일별 저장명은 {RVT파일명}_{기능명}_{오류건수00EA}.xlsx 형식이며 같은 이름이 있으면 뒤에 (2), (3)이 붙습니다.';

  const features = [
    {
      id: 'connector',
      group: 'BQC 검토',
      title: '파라미터 연속성 검토',
      badge: '배치 선택',
      summary: '연결된 MEP 객체 사이에서 사용자가 선택한 파라미터 값이 끊기거나 달라지는 지점을 찾습니다.',
      target: '활성 문서와 여러 RVT 검토를 지원합니다.',
      setup: [
        '허용 범위에는 연결된 MEP 객체를 같은 연결 후보로 볼 거리 기준을 숫자로 입력합니다. 단위는 inch 또는 mm 중 실제 검토 기준에 맞게 선택합니다.',
        '검토 파라미터 선택에서 Revit 관리 > 공유 매개변수에 연결된 TXT 목록을 검색한 뒤 연속성을 확인할 파라미터를 추가합니다. 여러 개를 선택하면 같은 연결 관계에 대해 각 파라미터를 함께 검토합니다.',
        '좌표 X/Y 추출을 켜면 결과 엑셀에 요소 위치 좌표 열을 추가합니다. 선형 길이 / 방향 벡터 추출을 켜면 선형 객체의 길이와 방향 X/Y/Z 정보를 함께 저장합니다.',
        '파라미터 값 일치 처리 매핑에서는 선택 파라미터의 모델 값을 스캔하고, 서로 다른 표기를 같은 값 그룹으로 등록합니다. 매핑은 비교 판정에만 사용되며 Revit 값은 바꾸지 않습니다.',
        'End + Dummy 패밀리 제외를 켜면 같은 패밀리명에 End와 Dummy가 모두 포함된 요소를 검토 대상에서 제외합니다. 타입명은 판정에 사용하지 않습니다.',
        '공통 설정의 추가 파라미터, 포함 필터, 제외 필터가 있으면 같은 대상 필터 기준을 이 기능에도 적용합니다.'
      ],
      run: [
        '설정 상태 카드에서 파라미터 연속성 검토가 설정 완료로 표시되는지 확인합니다. 선택 파라미터가 없으면 실행 버튼이 활성화되지 않습니다.',
        '활성 문서 검토는 현재 Revit에서 열려 있는 호스트 문서 하나를 기준으로 바로 실행합니다. 여러 문서가 열려 있으면 실행 대상 문서를 선택한 뒤 진행합니다.',
        '여러 RVT 검토는 오른쪽 실행 영역의 여러 RVT 검토 버튼으로 RVT 등록 창을 열고, 검토할 RVT 파일을 추가한 뒤 등록된 파일 기준으로 실행합니다.',
        '값 매핑이 필요하면 값 매핑 설정 열기에서 활성 문서 또는 여러 RVT를 먼저 스캔하고, 같은 뜻으로 취급할 값을 한 행에 묶은 뒤 매핑 설정 반영을 누릅니다.',
        '결과가 생성되면 결과창에서 오류/정상 건수를 확인하고, 필요한 경우 엑셀 내보내기로 결과 파일을 저장합니다.'
      ],
      logic: [
        '커넥터가 연결된 MEP 객체 쌍을 만들고, 같은 연결 체인 안에서 선택 파라미터 값을 비교합니다.',
        '값이 비어 있거나 서로 다른 경우 오류 후보로 기록합니다.',
        '허용 범위가 필요한 값은 설정 단위로 환산한 뒤 판정합니다.',
        '매핑표의 같은 행에 있는 현재값과 쉼표로 구분한 매핑값은 양방향으로 같은 값으로 판정합니다. 매핑표는 모델 값을 수정하지 않습니다.',
        'End + Dummy 제외 옵션이 켜져 있고 연결 쌍 중 한 요소의 같은 패밀리명에 End와 Dummy가 모두 포함되면 해당 연결 결과를 제외합니다. End만 있거나 Dummy만 있는 패밀리는 계속 검토합니다.',
        '결과에는 파일, 요소, 연결 상대, 좌표, 선택 파라미터 값, 판정 문구가 포함됩니다.'
      ],
      result: [
        '오류 건수와 정상 건수를 기능 결과 카드에 표시합니다.',
        '엑셀에는 오류 행 중심으로 저장하며, 선택한 추가 옵션에 따라 좌표와 선형 정보 열이 추가됩니다. 값 매핑으로 정상 처리된 쌍은 불연속 오류로 집계하지 않습니다.',
        '오류가 없으면 오류 없음 메시지 행을 저장합니다.'
      ],
      export: {
        multi: true,
        single: 'Connector_Selected {N} Files.xlsx 또는 Connector_yyyyMMdd_HHmm.xlsx',
        splitKo: '파라미터 연속성 검토',
        splitEn: 'Parameter Continuity Error (Location-based)',
        note: '영문 파일별 저장에서는 선택 파라미터명이 있으면 {파라미터명} Continuity Error (Location-based) 형태로 기능명이 바뀔 수 있습니다.'
      },
      notes: [sharedParamNote]
    },
    {
      id: 'unconnected',
      group: 'BQC 검토',
      title: '미연결 검토',
      badge: '배치 선택',
      summary: '배관, 덕트, 트레이, 컨듀잇 피팅과 장비류의 커넥터가 연결되지 않은 상태를 찾습니다.',
      target: '활성 문서와 여러 RVT 검토를 지원합니다.',
      userGuide: '기본 커넥터 미연결 여부와 필요 시 배관·덕트·트레이 경사도, 탭/새들 묻힘을 함께 검토합니다. 경사도는 "오류 인정 최소 각도"보다 크고 "오류 인정 최대 각도" 이하인 경우만 오류로 기록합니다.',
      setupLead: '기본 미연결 범위를 먼저 정하고, 경사도 또는 탭/새들 묻힘 검토가 필요한 경우에만 해당 세부 설정을 켭니다.',
      setup: [
        '검토 허용 범위와 단위를 지정합니다. 경사도 검토를 함께 실행할 때 최소 각도 기본값은 0.01도 초과, 최대 각도 기본값은 15도 이하입니다.',
        '탭/새들 묻힘 오류를 함께 출력할지 선택합니다.',
        '필요하면 검토 제외 필터를 설정합니다.'
      ],
      settingDetails: [
        {
          label: '경사도 검토 함께 실행',
          description: '배관·덕트·트레이의 실제 경사각이 설정한 오류 범위 안에 있을 때만 경사도 오류로 추가 기록합니다. Conduit와 수직 입상은 경사도 대상이 아닙니다.',
          example: '기본 0.01도 초과~15도 이하에서는 정확히 0.01도는 정상, 0.010001도와 정확히 15도는 오류, 15도를 넘는 각도는 정상으로 처리합니다.'
        },
        {
          label: '최소·최대 오류 각도',
          description: '최소값은 초과, 최대값은 이하 경계입니다. 화면에는 각도와 함께 퍼센트·분수·소수 경사비 환산값도 표시됩니다.',
          example: '최소 0.5도, 최대 5도로 바꾸면 0.5도를 초과하면서 5도 이하인 경사만 오류로 기록됩니다.'
        },
        {
          label: '탭/새들 묻힘과 공통 필터',
          description: '탭/새들 묻힘 검토는 켠 경우에만 별도 오류를 기록합니다. 공통 포함·제외 필터는 커넥터와 경사도 검토 모두에 같은 대상 범위로 적용됩니다.',
          example: '특정 설비 패밀리를 제외하면 해당 패밀리의 열린 커넥터와 경사도 모두 결과에서 빠집니다.'
        }
      ],
      run: [
        '대상 문서를 선택한 뒤 검토를 실행합니다.',
        '여러 RVT 검토에서는 등록된 파일을 순서대로 열어 검토한 뒤 닫습니다.'
      ],
      logic: [
        '커넥터를 가진 MEP 요소를 수집합니다.',
        '각 커넥터가 실제 연결 상태인지 확인하고, 열린 커넥터 또는 중심축 미연결 상태를 오류로 기록합니다.',
        '경사도 옵션이 켜진 경우 실제 각도를 계산한 뒤 최소값 초과 및 최대값 이하 조건을 모두 만족하는 객체만 경사도 오류로 기록합니다. 작은 각도는 판정값이 보이도록 더 많은 소수 자릿수로 표시합니다.',
        '탭/새들 관련 옵션이 켜져 있으면 묻힘 기준도 함께 검토합니다.',
        '제외 필터에 걸리는 요소는 결과에서 제외합니다.'
      ],
      result: [
        '미연결 건수와 정상 검토 건수를 표시합니다.',
        '엑셀에는 파일명, 카테고리, 패밀리/타입, ElementId, 오류 유형, 추가 파라미터가 저장됩니다.'
      ],
      export: {
        multi: true,
        single: 'UnconnectedConnectorReview_Selected {N} Files.xlsx 또는 UnconnectedConnectorReview_yyyyMMdd_HHmm.xlsx',
        splitKo: '미연결 검토',
        splitEn: 'Unconnected Connector Review'
      }
    },
    {
      id: 'floorinfo',
      group: 'BQC 검토',
      title: '레벨 영역별 파라미터 검토',
      badge: '영역 필요',
      summary: '레벨 또는 영역 기준으로 객체가 가져야 할 파라미터 값과 실제 값을 비교합니다.',
      target: '활성 문서와 여러 RVT 검토를 지원합니다.',
      setup: [
        '레벨/영역 기준을 설정합니다.',
        '비교할 파라미터와 기준 값을 지정합니다.',
        '필요하면 공통 필터로 대상 카테고리나 패밀리를 제한합니다.'
      ],
      run: [
        '설정 완료 후 활성 문서 또는 여러 RVT 검토를 실행합니다.',
        '영역 기준이 없는 상태에서는 검토 버튼이 활성화되지 않습니다.'
      ],
      logic: [
        '객체의 위치가 어느 레벨/영역에 속하는지 계산합니다.',
        '그 영역에 지정된 기준 파라미터 값과 실제 객체 값을 비교합니다.',
        '값이 비었거나 기준과 다르면 오류로 기록합니다.',
        '대상 영역을 판정할 수 없는 객체는 별도 상태로 표시합니다.'
      ],
      result: [
        '영역 기준 불일치 건수와 정상 건수를 표시합니다.',
        '엑셀에는 파일, 영역, ElementId, 파라미터명, 기준값, 실제값, 판정 결과가 저장됩니다.'
      ],
      export: {
        multi: true,
        single: 'FloorInfoReview_yyyyMMdd_HHmm.xlsx',
        splitKo: '레벨영역별파라미터검토',
        splitEn: '레벨영역별파라미터검토'
      }
    },
    {
      id: 'gridlevelconsistency',
      group: 'BQC 검토',
      title: 'Grid / Level 기준 정합성 검토',
      badge: '기준 필요',
      summary: '기준 RVT에서 추출하거나 기존에 보관한 통합 기준 Excel로 Grid 위치·방향·교차점과 Level 이름·높이를 비교합니다.',
      target: '활성 문서와 여러 RVT 검토를 지원합니다.',
      userGuide: '좌표 기준을 정하고 표준 RVT에서 Grid와 Level을 통합 기준 Excel로 추출한 뒤, 그 Excel을 실제 검토 기준으로 등록합니다. 이미 추출한 기준 Excel이 있으면 RVT 등록과 추출 단계는 건너뛸 수 있습니다.',
      setupLead: '좌표 기준 → 기준 Excel 생성 또는 선택 → 검토 범위와 허용 오차 → 대상 선택 순서로 설정합니다.',
      setup: [
        '좌표 기준은 Shared Coordinates가 기본 권장값입니다. 모든 RVT에 같은 공유좌표가 저장되어 있지 않다면 내부 원점과 축이 실제로 같은 프로젝트에서만 Internal Origin을 선택합니다.',
        '새 기준을 만들 때는 활성 문서 또는 기준 RVT를 등록하고 통합 기준 Excel을 추출합니다. 기존 기준 Excel이 있으면 이 단계는 건너뜁니다.',
        '추출한 파일 또는 기존 통합 기준 Excel을 등록합니다. 실제 검토는 등록된 Excel의 Grid와 Level 원시값만 사용합니다.',
        '검토 범위에서 Grid 검토, Level 검토 또는 둘 다를 켭니다. 둘 다 끄면 설정을 완료하거나 실행할 수 없습니다.',
        '거리 단위는 mm 또는 inch를 선택합니다. Grid 위치, Grid 방향각, Level 높이 허용 오차의 기본값 0은 반올림 없이 정확히 일치해야 정상이라는 뜻입니다.',
        '이름까지 비교를 켜면 위치나 높이가 같아도 이름만 다를 때 “이름만 다름”으로 구분합니다. 대상 문서의 추가 Grid / Level도 보고를 켜면 기준에는 없고 대상에만 있는 항목도 결과에 남깁니다.'
      ],
      settingDetails: [
        {
          label: '검토 범위',
          description: 'Grid와 Level 중 실제로 비교할 항목만 선택합니다.',
          example: 'Grid 배치만 확인하는 납품 검토라면 Grid 검토만 켜고 Level 검토는 끕니다.'
        },
        {
          label: '좌표 기준',
          description: 'Shared Coordinates 또는 Internal Origin 중 모든 기준·대상 RVT가 공통으로 사용할 좌표계를 선택합니다.',
          example: '분야별 RVT가 같은 공유좌표를 Acquire/Publish해 저장했다면 Shared Coordinates를 선택합니다.'
        },
        {
          label: '통합 기준 Excel 생성·등록',
          description: '표준 RVT의 Grid 선형과 Level 높이를 한 Excel로 추출하고, 검증된 그 파일을 실제 기준으로 등록합니다.',
          example: 'A_Grid_Level_Standard.rvt를 Shared Coordinates로 등록해 기준 Excel을 추출한 뒤 바로 다시 등록합니다.'
        },
        {
          label: '허용 오차',
          description: 'Grid 위치와 Level 높이는 선택한 거리 단위, Grid 방향은 degree로 입력합니다. 입력값 이하의 차이는 정상입니다.',
          example: 'Grid 위치 1 mm, 방향 0.001°, Level 높이 1 mm로 설정하면 각 차이가 해당 값 이하일 때 정상으로 봅니다.'
        },
        {
          label: '이름과 추가 항목',
          description: '기하 위치와 별도로 이름 차이를 보고하고, 기준에 없는 대상 문서의 추가 Grid/Level을 결과에 포함할지 정합니다.',
          example: '기준 A와 같은 위치의 대상 A-1은 이름만 다름, 기준에 없는 대상 C는 추가로 기록됩니다.'
        }
      ],
      run: [
        '등록한 통합 기준 Excel의 좌표 기준, 파일 단위, Schema 버전과 Grid/Level 개수를 확인합니다.',
        '설정한 좌표 기준과 Excel의 좌표 기준이 다르거나 선택한 범위에 유효한 기준 행이 없으면 검토를 시작할 수 없습니다.',
        '활성 문서 검토는 현재 열린 호스트 문서를 대상으로 실행합니다. 여러 호스트 문서가 열려 있으면 대상 문서를 선택합니다.',
        '여러 RVT 검토는 기존 대상 RVT 등록 목록을 그대로 사용합니다. 등록한 통합 기준 Excel 하나가 선택한 모든 대상 파일에 공통 적용됩니다.',
        '완료 후 검토 기준 수, 불일치/누락 수, 정상 기준 수를 확인하고 필요하면 오류사항 Excel을 저장합니다.'
      ],
      logic: [
        'Shared Coordinates는 각 문서의 활성 Project Location을 이용해 Grid와 Level을 같은 공유 좌표계로 변환하고, 기준 Excel에 저장된 공통 Anchor를 모든 대상에 적용합니다.',
        'Internal Origin은 각 RVT 자체의 내부 원점과 축을 그대로 비교합니다. 공유좌표나 링크 인스턴스의 수동 이동·회전은 반영하지 않습니다.',
        '직선 Grid는 방향을 앞뒤가 없는 하나의 선으로 정규화한 뒤 무한 직선의 위치와 방향각을 비교합니다. Arc Grid와 MultiSegmentGrid는 지원하지 않음으로 기록합니다.',
        '두 직선 Grid의 교차점도 계산해 기준과 대상의 교차 관계가 같은지 확인합니다. 방향선 사이의 예각이 20도보다 작은 거의 평행한 조합은 원거리 허위 교차점을 만들 수 있어 교차점 계산과 결과에서 제외합니다. 정확히 20도 이상인 조합만 비교합니다.',
        'Level은 Revit ProjectElevation을 선택 좌표계의 Z로 변환한 뒤 기준 Excel 값과 비교합니다.',
        '0 허용 오차는 정확 일치, 0보다 큰 값은 입력값 이하를 정상으로 판정합니다.',
        '상태는 정상, 이름만 다름, 위치 불일치, 높이 불일치, 교차점 불일치, 대상 평행, 누락, 추가, 모호함, 지원하지 않음으로 구분합니다. 이름만 다름과 지원하지 않음은 확인 필요 항목이며 위치 오류와 같은 오류로 합치지 않습니다.'
      ],
      result: [
        '결과 카드에는 전체 검토 기준, 불일치/누락, 정상 기준 건수를 표시합니다.',
        'Excel은 오류사항 시트 하나로 만들며 정상 행은 생략합니다.',
        '오류사항 시트에는 대상 파일명, 구분, 기준 이름, 대상 이름, 기준과 차이, 오류 사항을 기록합니다. 대상 파일은 폴더 경로와 .rvt 확장자를 제외한 이름으로 표시합니다.'
      ],
      export: {
        multi: true,
        single: '{RVT파일명}_GridLevelConsistency.xlsx 또는 GridLevelConsistency_Selected_{파일수}_Files_yyyyMMdd_HHmm.xlsx',
        splitKo: 'GridLevel정합성검토',
        splitEn: 'Grid Level Consistency Review',
        note: '결과 파일은 오류사항 시트만 사용하고 정상 항목은 저장하지 않습니다. 통합 기준 Excel은 결과 파일과 별개의 입력 파일입니다.'
      },
      notes: [
        '호스트에서 링크를 임의로 이동·회전해 화면상 맞춘 위치는 독립 RVT 파일만으로 복원할 수 없습니다. Shared Coordinates 모드는 모든 파일에 동일 공유좌표가 실제로 저장되어 있어야 합니다.',
        'Arc Grid와 MultiSegmentGrid는 현재 기하 비교 대상이 아니며 지원하지 않음 상태로 확인합니다.'
      ]
    },
    {
      id: 'familysuitability',
      group: 'BQC 검토',
      title: '패밀리 타입 적합성 검토',
      badge: '엑셀 필요',
      summary: '기준 엑셀에 등록된 카테고리, 패밀리, 타입 조합과 모델에 실제 사용된 타입을 비교합니다.',
      target: '활성 문서와 여러 RVT 검토를 지원합니다.',
      setup: [
        '승인 기준 엑셀을 선택합니다.',
        '검토 대상 카테고리와 예외 규칙을 확인합니다.',
        '필요하면 패밀리명 또는 타입명 기준 필터를 추가합니다.'
      ],
      run: [
        '기준 엑셀이 등록된 뒤 검토를 실행합니다.',
        '여러 RVT 검토는 같은 기준 엑셀을 모든 등록 파일에 적용합니다.'
      ],
      logic: [
        '모델에서 사용 중인 패밀리 타입을 수집합니다.',
        '기준 엑셀의 승인 목록과 카테고리/패밀리/타입 단위로 매칭합니다.',
        '승인 목록에 없거나 카테고리 매칭이 어긋난 항목을 오류로 기록합니다.',
        '검토 제외 조건에 해당하는 타입은 결과에서 제외합니다.'
      ],
      result: [
        '부적합 타입 건수와 정상 타입 건수를 표시합니다.',
        '엑셀에는 파일, 카테고리, 패밀리, 타입, 승인 여부, 비고가 저장됩니다.'
      ],
      export: {
        multi: true,
        single: 'FamilySuitabilityReview_yyyyMMdd_HHmm.xlsx',
        splitKo: '패밀리 적합성검토',
        splitEn: 'Not Approved Family Review'
      }
    },
    {
      id: 'tapalign',
      group: 'BQC 검토',
      title: '탭/분기 축 틀어짐 검토',
      badge: '배치 선택',
      summary: '탭 또는 분기 피팅의 축이 연결 배관/덕트 중심축과 어긋난 상태를 찾습니다.',
      target: '활성 문서와 여러 RVT 검토를 지원합니다.',
      setup: [
        '축 어긋남 허용값과 단위를 설정합니다.',
        '좌표, 선형 길이, 방향 벡터 등 추가 출력 옵션을 선택합니다.',
        '검토 대상 필터와 제외 필터를 확인합니다.'
      ],
      run: [
        '설정 완료 후 대상 문서 검토를 실행합니다.',
        '여러 RVT 검토는 등록 파일별로 결과를 분리해 집계합니다.'
      ],
      logic: [
        '탭/분기 피팅과 연결된 주 배관/덕트의 축 벡터를 계산합니다.',
        '분기 피팅 중심선과 기준 축 사이의 편차를 설정 단위로 환산합니다.',
        '편차가 허용값을 초과하면 오류로 기록합니다.',
        '좌표와 방향 벡터 옵션은 판정 근거를 추적하기 위한 보조 열로 저장합니다.'
      ],
      result: [
        '축 틀어짐 오류 건수와 정상 건수를 표시합니다.',
        '엑셀에는 파일, 요소, 기준 축, 편차값, 허용값, 판정 결과가 저장됩니다.'
      ],
      export: {
        multi: true,
        single: 'TapAlign_Selected {N} Files.xlsx 또는 TapAlign_yyyyMMdd_HHmm.xlsx',
        splitKo: '탭분기 축 틀어짐 검토',
        splitEn: 'Tap Branch Axis Misalignment Review'
      }
    },
    {
      id: 'tapdepth',
      group: 'BQC 검토',
      title: 'Tap, Saddle 모델링 검토 (묻힘)',
      badge: '배치 선택',
      summary: 'Tap/Saddle 객체의 실제 묻힘 깊이를 Takeoff Length 기준과 비교합니다.',
      target: '활성 문서와 여러 RVT 검토를 지원합니다.',
      setup: [
        '묻힘 허용값과 단위를 설정합니다.',
        'Takeoff Length Projection 또는 Takeoff Length 기준을 확인합니다.',
        '좌표와 방향 벡터 출력 여부를 선택합니다.'
      ],
      run: [
        '대상 문서를 선택하고 검토를 실행합니다.',
        '동일 설정으로 여러 RVT를 한 번에 검토할 수 있습니다.'
      ],
      logic: [
        'Tap/Saddle 객체와 연결 기준 객체를 찾습니다.',
        '실제 삽입 깊이를 계산하고 설정한 Takeoff Length 기준과 비교합니다.',
        '차이가 허용 범위를 초과하면 오류로 기록합니다.',
        'Dummy 또는 제외 패밀리 조건에 해당하는 요소는 제외할 수 있습니다.'
      ],
      result: [
        '묻힘 오류 건수와 정상 건수를 표시합니다.',
        '엑셀에는 기준 길이, 실제 깊이, 차이, 허용값, 판정 결과가 저장됩니다.'
      ],
      export: {
        multi: true,
        single: 'TapDepth_Selected {N} Files.xlsx 또는 TapDepth_yyyyMMdd_HHmm.xlsx',
        splitKo: 'Tap Saddle 묻힘 검토',
        splitEn: 'Tap Saddle Embed Review'
      }
    },
    {
      id: 'dupclash',
      group: 'BQC 검토',
      title: '중복 / 자체 간섭 검토',
      badge: '배치 선택',
      summary: '여러 RVT를 대상으로 중복 객체 또는 자체 간섭 객체를 찾습니다.',
      target: '여러 RVT 검토 중심 기능입니다. 활성 문서 검토도 같은 설정 흐름에서 실행할 수 있습니다.',
      setup: [
        '검토 모드를 중복 검토 또는 자체 간섭으로 선택합니다.',
        '허용 오차, 범위, 비교쌍, 제외 세트, 제외 목록, 키워드, 속성 추출 항목을 설정합니다.',
        '필요하면 검사할 카테고리와 패밀리 예외를 조정합니다.'
      ],
      run: [
        '여러 RVT 검토에서 대상 파일을 등록하고 검토 시작을 누릅니다.',
        '활성 문서 검토는 현재 호스트 문서를 기준으로 실행합니다.'
      ],
      logic: [
        '중복 검토는 위치, 형상, 주요 파라미터가 같은 객체 후보를 그룹화합니다.',
        '자체 간섭 검토는 같은 파일 안에서 객체 간 형상 충돌 여부를 계산합니다.',
        '허용 오차 이하의 차이는 같은 위치로 처리하고, 제외 세트/키워드는 후보에서 제거합니다.',
        '선택한 속성 추출 항목은 결과 행에 보조 정보로 붙습니다.'
      ],
      result: [
        '중복 그룹 수 또는 자체 간섭 건수를 표시합니다.',
        '엑셀에는 파일, 그룹, ElementId, 카테고리, 패밀리/타입, 위치, 판정 결과가 저장됩니다.'
      ],
      export: {
        multi: true,
        single: 'Duplicate_Selected {N} Files.xlsx, SelfClash_Selected {N} Files.xlsx 또는 Duplicate/SelfClash_yyyyMMdd_HHmm.xlsx',
        splitKo: '중복검토 또는 자체간섭검토',
        splitEn: 'Modeling Duplication 또는 Self Clash Review'
      }
    },
    {
      id: 'worksetassignment',
      group: 'BQC 검토',
      title: '웍셋 배정 검토',
      badge: '배치 선택',
      summary: '모델 객체가 허용된 정상 웍셋에 배정되어 있는지 확인합니다.',
      target: '활성 문서와 여러 RVT 검토를 지원합니다.',
      setup: [
        '정상으로 인정할 웍셋 이름 목록을 입력합니다.',
        '대상 카테고리와 제외 조건을 확인합니다.'
      ],
      run: [
        '설정 완료 후 대상 문서 검토를 실행합니다.',
        '여러 RVT 검토에서는 파일별로 웍셋 배정 오류를 집계합니다.'
      ],
      logic: [
        '검토 대상 요소의 Workset 정보를 읽습니다.',
        '입력한 정상 웍셋 목록에 없으면 오류로 기록합니다.',
        '검토 대상 요소의 현재 웍셋이 정상 웍셋 목록에 포함되는지 파일별로 판정합니다.'
      ],
      result: [
        '웍셋 오류 건수와 정상 건수를 표시합니다.',
        '엑셀에는 파일, ElementId, 카테고리, 현재 웍셋, 기대 웍셋 기준이 저장됩니다.'
      ],
      export: {
        multi: true,
        single: 'WorksetAssignment_Selected {N} Files.xlsx 또는 WorksetAssignment_yyyyMMdd_HHmm.xlsx',
        splitKo: '웍셋 배정 검토',
        splitEn: 'Workset Assignment Error'
      }
    },
    {
      id: 'parameterduplication',
      group: 'BQC 검토',
      title: '프로젝트 파라미터 중복 검토',
      badge: '배치 선택',
      summary: '프로젝트에 추가된 파라미터 중 같은 이름으로 중복 등록된 항목을 찾습니다.',
      target: '활성 문서와 여러 RVT 검토를 지원합니다.',
      setup: [
        '검토할 공유파라미터 또는 프로젝트 파라미터 기준을 선택합니다.',
        '필요하면 검토 대상 그룹과 예외 조건을 지정합니다.'
      ],
      run: [
        '파라미터 목록이 갱신되면 대상 문서 검토를 실행합니다.',
        '공유파라미터는 Revit에 연결된 TXT에서 자동으로 읽습니다.'
      ],
      logic: [
        '프로젝트 파라미터 바인딩과 공유파라미터 정의를 수집합니다.',
        '표시 이름이 같은 파라미터가 서로 다른 GUID 또는 바인딩으로 중복 등록되어 있는지 확인합니다.',
        '카테고리 바인딩 범위가 겹치는 중복을 우선 오류로 기록합니다.'
      ],
      result: [
        '중복 파라미터 오류 건수와 정상 건수를 표시합니다.',
        '엑셀에는 파라미터명, GUID, 그룹, 바인딩, 카테고리, 중복 판정이 저장됩니다.'
      ],
      export: {
        multi: true,
        single: 'ProjectParameterDuplication_Selected {N} Files.xlsx 또는 ProjectParameterDuplication_yyyyMMdd_HHmm.xlsx',
        splitKo: 'Parameter 중복검토',
        splitEn: 'Parameter Duplication'
      },
      notes: [sharedParamNote]
    },
    {
      id: 'parametermissing',
      group: 'BQC 검토',
      title: '파라미터 누락 검토',
      badge: '기준 필요',
      summary: '대상 객체가 가져야 할 공유파라미터 값이 비어 있는지 확인합니다.',
      target: '활성 문서와 여러 RVT 검토를 지원합니다.',
      setup: [
        '검토할 파라미터와 필수 입력 기준을 선택합니다.',
        '공통 필터와 제외 필터를 설정합니다.',
        '프리셋이 있으면 불러와 같은 기준을 적용합니다.'
      ],
      run: [
        '설정 완료 후 활성 문서 또는 여러 RVT 검토를 실행합니다.',
        '공유파라미터 목록은 Revit에 연결된 TXT에서 자동으로 갱신됩니다.'
      ],
      logic: [
        '검토 대상 요소를 수집하고 선택 파라미터 값을 읽습니다.',
        '값이 null, 빈 문자열, 공백만 있는 경우 누락으로 판정합니다.',
        '제외 조건과 포함 필터를 먼저 적용한 뒤 누락 여부를 판단합니다.'
      ],
      result: [
        '누락 오류 건수와 정상 건수를 표시합니다.',
        '엑셀에는 파일, ElementId, 파라미터명, 현재값, 카테고리, 패밀리/타입이 저장됩니다.'
      ],
      export: {
        multi: true,
        single: 'ParameterMissing_Selected {N} Files.xlsx 또는 ParameterMissing_yyyyMMdd_HHmm.xlsx',
        splitKo: '속성누락검토',
        splitEn: 'Parameter Value Omission'
      },
      notes: [sharedParamNote]
    },
    {
      id: 'parameterstandard',
      group: 'BQC 검토',
      title: '속성 기준값 검토',
      badge: '기준 엑셀',
      summary: '기준 엑셀에 정의된 파라미터 기준값과 모델 객체의 실제 값을 비교합니다.',
      target: '활성 문서와 여러 RVT 검토를 지원합니다.',
      userGuide: '일반 기준 시트는 한 파라미터의 허용값 목록을, CUSTOM# 시트는 여러 파라미터의 허용 조합을 정의합니다. 값은 대소문자까지 정확히 비교합니다.',
      setupLead: '기준 Excel의 시트 형식을 먼저 확인한다. 단일 파라미터는 일반 시트, 서로 묶여야 하는 값은 CUSTOM# 시트로 작성합니다.',
      setup: [
        '기준 엑셀을 선택합니다. 일반 시트는 시트명 또는 A1에 파라미터명, B2 아래에 허용값을 입력합니다.',
        '여러 파라미터 조합을 검사할 때는 CUSTOM1, CUSTOM2처럼 CUSTOM# 이름의 시트를 만들고 B1, C1, D1부터 빈 열 없이 파라미터명을 입력한 뒤 B2 아래에 정상 조합을 작성합니다.',
        '비교할 파라미터, 카테고리, 예외 조건을 확인합니다.',
        '필요하면 공통 필터로 대상 객체를 제한합니다.'
      ],
      settingDetails: [
        {
          label: '일반 기준 시트',
          description: '한 파라미터에 허용되는 개별 값을 등록합니다. 값은 대소문자까지 같은 경우만 정상입니다.',
          example: '시트명이 System Classification이면 B2부터 Supply Air, Return Air를 입력합니다. 모델 값 supply air는 다른 값으로 오류입니다.'
        },
        {
          label: 'CUSTOM# 조합 시트',
          description: 'B1, C1, D1부터 두 개 이상 파라미터명을 연속으로 적고, 각 행에는 허용되는 하나의 값 조합을 입력합니다. 같은 조합이 아니면 오류입니다.',
          example: 'CUSTOM1의 B1=System, C1=Zone이고 B2=Supply, C2=A라면 System=Supply와 Zone=A 조합만 정상입니다.'
        },
        {
          label: '기준 파일 유효성',
          description: 'CUSTOM# 헤더 사이에 빈 열이 있거나 같은 파라미터명이 중복되면 해당 시트는 건너뛰고 경고를 남깁니다. 입력방법, Guide, ReadMe 시트는 기준 시트로 읽지 않습니다.',
          example: 'B1=System, C1을 비워 두고 D1=Zone으로 작성하면 CUSTOM# 시트가 무효로 처리됩니다.'
        }
      ],
      run: [
        '기준 엑셀 등록 후 검토를 실행합니다.',
        '여러 RVT 검토에서는 동일한 기준 엑셀을 모든 파일에 적용합니다.'
      ],
      logic: [
        '기준 엑셀의 키와 모델 객체의 파라미터 값을 매칭합니다.',
        '일반 시트는 해당 파라미터의 허용값 집합에 실제값이 있는지, CUSTOM# 시트는 한 행의 전체 파라미터 조합이 일치하는지 검사합니다.',
        '기준값과 실제값이 대소문자까지 다르면 오류로 기록합니다. 다른 값으로 자동 보정하지 않습니다.',
        '공란 표기는 기준 Excel에서 정의한 공란 규칙으로 처리하고, 그 밖의 문자열은 임의의 대소문자 정규화를 하지 않습니다.'
      ],
      result: [
        '기준 불일치 건수와 정상 건수를 표시합니다.',
        '엑셀에는 기준값, 실제값, 오류 유형, 대상 요소 정보가 저장됩니다.'
      ],
      export: {
        multi: true,
        single: 'ParameterStandardReview_yyyyMMdd_HHmm.xlsx',
        splitKo: '속성모수검토',
        splitEn: 'Parameter Standard Review'
      }
    },
    {
      id: 'ghostcleaner',
      group: 'BQC 검토',
      title: '유령객체 제거',
      badge: '선택 삭제',
      summary: '호스트나 Run 참조가 끊겨 정상적인 편집 화면에서는 찾기 어려운 모델 객체를 검출하고, 규칙에 따라 삭제한 뒤 전후 객체 수를 대조합니다.',
      target: '활성 문서와 여러 RVT 검토를 지원하며, 다른 선택 검토보다 먼저 실행됩니다.',
      userGuide: '모델 안에 남은 비정상 참조 객체를 정리하는 기능입니다. 명백한 유령객체 다섯 종류는 항상 삭제하고, 추가로 의심되는 네 종류는 설정에서 삭제 여부를 선택합니다. Excel에는 실제 삭제 과정에서 Revit이 반환한 객체만 기록됩니다.',
      setup: [
        '자동 삭제 규칙에는 호스트 없는 Duct Insulation, Pipe Insulation, Duct Lining과 참조 없는 Conduit Run, Cable Tray Run이 표시됩니다. 이 다섯 규칙은 기능을 실행하면 항상 검출과 삭제를 수행합니다.',
        '선택 삭제 규칙에서는 호스트 없는 Opening, 필수 호스트가 사라진 FamilyInstance, 빈 Mechanical System, 빈 Piping System의 삭제 여부를 정합니다.',
        '선택 규칙을 끄면 해당 객체는 삭제하지 않습니다. 결과 카드의 검출만 수로 후보 존재 여부를 확인한 뒤 필요한 규칙만 켜는 방식이 안전합니다.',
        '호스트 없는 Opening 검사에서는 Shaft Opening을 정상 예외로 제외합니다. 필수 호스트 FamilyInstance는 배치 방식이 OneLevelBasedHosted이면서 Host가 없는 인스턴스만 대상으로 봅니다.',
        '여러 기능을 한 번에 실행하면 유령객체 제거가 먼저 모델을 정리하고, 그 다음에 선택한 다른 BQC 검토가 정리된 모델을 기준으로 실행됩니다.'
      ],
      setupLead: '항상 삭제되는 규칙과 사용자가 삭제 여부를 정하는 규칙을 구분해 확인합니다.',
      settingDetails: [
        {
          label: '자동 삭제 규칙',
          description: '호스트 또는 Run 참조가 명백히 끊긴 다섯 종류는 별도 체크 없이 항상 삭제합니다.',
          example: 'Duct Insulation의 HostElementId가 비어 있거나 현재 문서에 호스트가 없으면 자동 삭제 대상입니다.'
        },
        {
          label: '호스트 없는 Opening 삭제',
          description: 'Host가 없는 Opening을 선택 삭제합니다. Shaft Opening은 정상 예외로 남깁니다.',
          example: '일반 Opening의 호스트 벽이 삭제된 뒤 객체만 남은 경우를 정리하려면 켭니다.'
        },
        {
          label: '필수 호스트가 사라진 FamilyInstance 삭제',
          description: 'OneLevelBasedHosted 방식으로 배치된 패밀리 중 Host가 사라진 인스턴스를 선택 삭제합니다.',
          example: '벽 호스트 기반 장비 패밀리에서 벽만 삭제되어 인스턴스가 고립된 경우를 정리하려면 켭니다.'
        },
        {
          label: '빈 Mechanical / Piping System 삭제',
          description: 'Revit API에서 IsEmpty=True인 MechanicalSystem과 PipingSystem을 종류별로 선택 삭제합니다.',
          example: '요소는 모두 제거됐지만 시스템 정의만 남은 경우 두 옵션을 필요한 분야에 맞게 켭니다.'
        },
        {
          label: '검출만 사용',
          description: '선택 규칙을 끄면 삭제하지 않고 결과 카드의 검출만 수에만 반영합니다. 삭제되지 않은 후보는 Excel에 포함되지 않습니다.',
          example: '첫 실행에서는 네 선택 규칙을 모두 끄고 검출만 수를 확인한 뒤 승인된 규칙만 켜 재실행합니다.'
        }
      ],
      run: [
        '기능 설정에서 자동 삭제 규칙과 선택 삭제 규칙을 확인하고 설정 완료를 누릅니다.',
        '현재 열린 모델만 정리할 때는 활성 문서 검토를 누릅니다. 읽기 전용 문서와 패밀리 문서는 실행할 수 없습니다.',
        '여러 파일을 정리할 때는 여러 RVT 검토를 눌러 RVT 등록 창을 열고 대상 파일을 선택한 뒤 실행합니다.',
        '다른 BQC 기능도 함께 선택했다면 유령객체 제거 결과가 먼저 만들어지고, 정리된 상태에서 나머지 검토가 이어집니다.',
        '완료 후 검출 수, 삭제 요청 수, 실제 삭제 수, 검출만 수, 예상 외 삭제 수와 파일별 상태를 확인한 뒤 Excel을 저장합니다.'
      ],
      logic: [
        '실행 전 CategoryType.Model 인스턴스의 ElementId를 기록하고 각 규칙으로 후보를 수집합니다.',
        '자동 규칙 후보와 체크된 선택 규칙 후보만 삭제 요청에 넣습니다. 체크하지 않은 선택 후보는 검출만 상태로 남깁니다.',
        '각 후보는 개별 SubTransaction으로 삭제를 시도하므로 한 객체 삭제가 실패해도 다음 후보를 계속 처리합니다.',
        '실행 후 모델 ElementId를 다시 수집해 실제 삭제 객체를 계산하고, 요청하지 않았지만 함께 삭제된 객체와 실행 중 새로 생긴 객체도 따로 기록합니다.',
        '삭제 반환 ID, 실행 전후 차집합, 카테고리별 객체 수를 비교해 실제 모델 변화와 집계식이 맞는지 검증합니다.'
      ],
      result: [
        '결과 카드에는 파일 수, 실행 전후 모델 객체 수, 검출 수, 삭제 요청 수, 실제 삭제 수, 검출만 수, 실패 수가 표시됩니다.',
        'Excel은 검토 결과 시트 하나로 구성되며, Revit의 Document.Delete가 반환한 삭제 객체만 표시합니다.',
        '상세 열은 Element ID, 카테고리, 타입, 호스트 ID, 호스트 카테고리, 호스트 패밀리, 호스트 타입, 삭제 분류만 남깁니다.',
        '시트 마지막 행에는 전체 객체 수와 삭제 후 객체 수를 간단히 표시합니다.'
      ],
      export: {
        multi: true,
        single: 'GhostObjectAudit_{RVT파일명}_yyyyMMdd_HHmm.xlsx 또는 GhostObjectAudit_Selected {N} Files.xlsx',
        splitKo: '유령객체감사',
        splitEn: 'Ghost Object Audit',
        note: '파일별 저장은 공통 규칙에 따라 {RVT파일명}_유령객체감사_{오류건수00EA}.xlsx 또는 {RVT파일명}_Ghost Object Audit_{오류건수00EA}.xlsx 형식을 사용합니다.'
      },
      notes: [
        '삭제 기능이므로 첫 실행은 선택 삭제 규칙을 끈 검출만 상태로 확인하는 것을 권장합니다.',
        '유령객체 제거와 다른 기능을 함께 실행하면 후속 기능의 결과는 삭제가 반영된 모델을 기준으로 생성됩니다.'
      ]
    },
    {
      id: 'deliverycleaner',
      group: 'BQC 검토',
      title: 'RVT 정리 (납품용)',
      badge: '별도 화면',
      summary: '납품용 RVT를 만들기 위해 정리 대상 파일을 등록하고, 뷰/속성/불필요 항목 정리 흐름을 실행합니다.',
      target: '여러 RVT 등록 후 실행하는 별도 화면 기능입니다.',
      setup: [
        '중앙 설정 영역에서 결과 폴더와 정리용 3D 뷰 이름을 지정합니다.',
        '뷰 파라미터, 객체 파라미터, 뷰 필터, V/G 설정을 확인합니다.',
        '오른쪽 실행 영역에서 RVT 등록 창을 열어 대상 파일을 추가합니다.'
      ],
      run: [
        '기본/세부 설정을 완료한 뒤 정리 시작을 실행합니다.',
        '정리 결과 검토, 속성값 추출, 불필요 항목 제거, 결과 폴더 열기, 로그 저장을 순서대로 사용할 수 있습니다.'
      ],
      logic: [
        '등록 RVT를 열고 정리용 3D 뷰와 필요한 파라미터/필터/VG 설정을 적용합니다.',
        '불필요 항목 제거는 정리 결과 또는 선택 RVT 기준으로 실행합니다.',
        '작업 결과는 세션에 저장되어 후속 검토와 엑셀 저장에서 재사용됩니다.'
      ],
      result: [
        '정리 진행 상태, 성공/실패, 처리된 파일 수가 표시됩니다.',
        '각 결과 처리 버튼은 해당 단계의 캐시된 workbook 또는 로그를 저장합니다.'
      ],
      export: {
        multi: false,
        single: 'CleanVerification.xlsx, ModelParameterExport.xlsx, DesignOptionAudit.xlsx, PurgeObjectCountComparison.xlsx, RVT_정리_납품용_로그_yyyyMMdd_HHmmss.xlsx',
        splitKo: '',
        splitEn: '',
        note: '이 기능은 결과 종류별 저장 버튼을 사용합니다. 여러 RVT 결과의 파일별 추출 옵션은 공통 배치 결과창과 다릅니다.'
      }
    },
    {
      id: 'conditionextract',
      group: 'BQC 검토',
      title: '조건별 객체 대상 속성 추출',
      badge: '별도 화면',
      summary: '조건식으로 객체를 추려 필요한 파라미터, 좌표, 선형 정보를 엑셀로 추출합니다.',
      target: '활성 문서, 활성 문서 + 링크, 여러 RVT 묶음 추출을 지원하는 별도 화면 기능입니다.',
      setup: [
        '필터 조건과 조건 결합 방식을 설정합니다.',
        '추출할 파라미터, 단위, 좌표/선형 옵션을 지정합니다.',
        '필요한 경우 RVT 등록 창에서 여러 파일을 등록합니다.'
      ],
      run: [
        '활성 문서 검토, 활성 문서 + 링크 검토, 여러 RVT 검토 중 하나를 실행합니다.',
        '추출 결과가 있으면 엑셀 내보내기를 사용할 수 있습니다.'
      ],
      logic: [
        '조건 필터에 맞는 객체를 먼저 선별합니다.',
        '선별 객체에서 선택한 파라미터와 좌표/선형 정보를 읽습니다.',
        '필터 조건을 만족하지 않는 객체는 결과에서 제외합니다.'
      ],
      result: [
        '파일별 추출 대상 수와 로그가 표시됩니다.',
        '엑셀에는 조건 통과 객체의 속성값과 보조 정보가 저장됩니다.'
      ],
      export: {
        multi: false,
        single: 'ConditionExtractResult_yyyyMMdd_HHmmss.xlsx',
        splitKo: '',
        splitEn: '',
        note: '이 기능은 별도 화면의 결과 내보내기 흐름을 사용합니다.'
      }
    },
    {
      id: 'dup',
      group: '유틸리티',
      title: '중복 / 자체 간섭 검토',
      badge: '별도 화면',
      summary: '현재 활성 문서에서 중복 객체 또는 자체 간섭 객체를 단독으로 검토합니다.',
      target: '활성 문서 중심 기능입니다.',
      setup: [
        '검토 모드, 허용 오차, 비교 대상 범위, 제외 조건을 설정합니다.',
        '결과에 함께 출력할 속성 추출 항목을 선택합니다.'
      ],
      run: [
        '검토 시작을 누르면 현재 활성 호스트 문서를 기준으로 실행합니다.',
        '결과 확인 후 엑셀 내보내기를 실행합니다.'
      ],
      logic: [
        '중복 검토는 위치와 형상이 같은 객체 후보를 그룹화합니다.',
        '자체 간섭 검토는 같은 문서 안의 객체 간 충돌 후보를 계산합니다.',
        '허용 오차, 제외 세트, 키워드 조건을 반영해 최종 결과를 만듭니다.'
      ],
      result: [
        '중복 그룹 또는 간섭 페어가 결과 영역에 표시됩니다.',
        '엑셀에는 그룹, ElementId, 카테고리, 패밀리/타입, 좌표, 판정 정보가 저장됩니다.'
      ],
      export: {
        multi: false,
        single: 'yyyyMMdd_중복 검토결과_{건수}개.xlsx 또는 yyyyMMdd_자체간섭 검토결과_{건수}개.xlsx',
        splitKo: '',
        splitEn: '',
        note: '단독 기능이므로 한 파일/파일별 저장 선택은 제공하지 않습니다.'
      }
    },
    {
      id: 'paramprop',
      group: '유틸리티',
      title: '패밀리 공유파라미터 추가/연동',
      badge: '별도 화면',
      summary: '복합 패밀리와 하위 패밀리에 공유파라미터를 추가하거나 연동합니다.',
      target: '패밀리 파일과 공유파라미터 TXT 연결 상태가 필요한 별도 화면 기능입니다.',
      setup: [
        'Revit에 연결된 공유파라미터 목록에서 추가할 파라미터를 선택합니다.',
        '하위 패밀리 Dummy 제외, 단일 패밀리 처리, 인스턴스/타입 모드, 추가할 그룹을 지정합니다.',
        '필요하면 수정된 패밀리 저장 폴더를 선택합니다.'
      ],
      run: [
        '연동 실행을 누르면 대상 패밀리에 파라미터 추가와 연동을 수행합니다.',
        '작업 후 결과를 확인하고 엑셀 보고서를 저장할 수 있습니다.'
      ],
      logic: [
        '공유파라미터 정의를 Revit의 SharedParametersFilename에서 읽습니다.',
        '선택 파라미터가 패밀리에 없으면 지정 그룹과 모드로 추가합니다.',
        '복합 패밀리는 하위 패밀리 파라미터와 상위 패밀리 파라미터 연동 여부를 확인하고 연결합니다.',
        'Dummy 제외 옵션이 켜져 있으면 해당 하위 패밀리는 처리하지 않습니다.'
      ],
      result: [
        '추가됨, 이미 있음, 연동됨, 실패 항목이 결과로 표시됩니다.',
        '엑셀 보고서에는 패밀리명, 파라미터명, 처리 결과, 메시지가 저장됩니다.'
      ],
      export: {
        multi: false,
        single: 'KKY_ParamPropagator_Report.xlsx 또는 ParamProp_yyMMdd_HHmmss.xlsx',
        splitKo: '',
        splitEn: '',
        note: '이 기능은 패밀리 처리 결과 보고서를 저장합니다.'
      },
      notes: [sharedParamNote]
    },
    {
      id: 'segmentpms',
      group: '유틸리티',
      title: 'Segment-PMS 비교 검토',
      badge: '별도 화면',
      summary: 'RVT에서 추출한 Segment/배관 정보를 PMS 양식과 비교합니다.',
      target: 'RVT 추출, PMS 매핑, 검토를 한 화면에서 진행하는 별도 기능입니다.',
      setup: [
        'RVT 파일을 등록하고 Segment 정보를 엑셀로 추출합니다.',
        'PMS 양식 또는 추출 결과를 불러와 매핑을 준비합니다.',
        '필요하면 PMS 양식 샘플을 내려받아 작성합니다.'
      ],
      run: [
        '추출 시작으로 RVT 정보를 만들고, PMS 등록/업데이트 후 검토 시작을 실행합니다.',
        '검토 결과를 확인하고 엑셀로 내보냅니다.'
      ],
      logic: [
        'RVT의 Pipe Type, Segment, Class, Size 정보를 수집합니다.',
        'PMS의 ND, ID, OD, Class 기준과 비교합니다.',
        'Class 불일치, Size 불일치, Routing Class 불일치를 각각 결과 시트로 분리합니다.'
      ],
      result: [
        'Class 검토, Size 검토, Routing Class 검토 결과가 표시됩니다.',
        '엑셀에는 비교 대상, PMS 기준값, Revit 값, 판정 결과가 저장됩니다.'
      ],
      export: {
        multi: false,
        single: 'SegmentPmsExtract.xlsx, PMS_Template.xlsx, SegmentPmsResult.xlsx',
        splitKo: 'SegmentPms검토',
        splitEn: 'SegmentPms검토',
        note: '공통 배치 결과에서 저장할 경우 SegmentPms_yyyyMMdd_HHmm.xlsx 또는 파일별 {RVT파일명}_SegmentPms검토_00EA.xlsx 형식을 사용합니다.'
      }
    },
    {
      id: 'parammodifier',
      group: '유틸리티',
      title: '파라미터 수정기',
      badge: '별도 화면',
      summary: '조건에 맞는 객체를 찾아 지정 파라미터에 값을 일괄 입력합니다.',
      target: '활성 문서 또는 여러 RVT 적용을 지원하는 별도 화면 기능입니다.',
      setup: [
        '조건 파라미터, 연산자, 값을 입력합니다.',
        '입력할 파라미터와 입력 값을 지정합니다.',
        '활성 문서 작업 후 동기화 여부와 코멘트를 설정합니다.'
      ],
      run: [
        '활성 문서 적용 또는 여러 RVT 적용을 실행합니다.',
        '여러 RVT 적용은 작업 후 자동 저장/동기화 흐름을 따릅니다.'
      ],
      logic: [
        '조건 테이블에 맞는 대상 객체를 필터링합니다.',
        '입력 파라미터가 존재하고 쓰기 가능한 경우 값을 입력합니다.',
        '읽기 전용, 파라미터 없음, 타입 불일치 항목은 실패로 기록합니다.'
      ],
      result: [
        '수정 성공, 실패, 건너뜀 건수가 표시됩니다.',
        '엑셀에는 대상 요소, 입력 파라미터, 입력값, 처리 상태가 저장됩니다.'
      ],
      export: {
        multi: false,
        single: 'ParameterModifierResult_yyyyMMdd_HHmmss.xlsx',
        splitKo: '',
        splitEn: '',
        note: '작업 결과 로그를 한 파일로 저장합니다.'
      }
    },
    {
      id: 'linkpath',
      group: '유틸리티',
      title: 'Revit 링크 경로 추출/재지정',
      badge: '별도 화면',
      summary: '여러 RVT의 Revit 링크 현황을 추출하고, Action 기반 Excel에서 경로 재지정·신규 링크·삭제를 구분해 안전하게 적용합니다.',
      target: '여러 RVT 등록 후 링크 추출/적용을 수행하는 별도 화면 기능입니다.',
      setup: [
        'RVT 등록 창에서 호스트 파일을 추가합니다.',
        '링크 추출을 실행해 현재 경로, 링크 방식, 링크 상태와 기본 Action=유지가 담긴 현황 Excel을 만듭니다.',
        '노란색 입력 열에서 Action, 대상 경로, 경로 방식, 적용할 타입/인스턴스 웍셋만 필요한 행에 입력합니다.',
        '수정한 Excel을 선택하고 신규 링크가 있을 때만 신규 링크 배치 방식을 지정합니다.'
      ],
      run: [
        'Excel 기준 적용은 유지가 아닌 Reload From, 신규 링크, 삭제 Action 행만 실행 대상으로 처리합니다.',
        '호스트 RVT 하나 안에서 성공한 작업은 저장·동기화·재확인을 마친 뒤 다음 행으로 진행하므로 일부 행이 실패해도 이미 확인된 작업을 되돌리지 않습니다.'
      ],
      logic: [
        '호스트 파일을 열어 Revit 링크 인스턴스와 타입 경로, 현재 링크 상태를 수집합니다.',
        '기존 링크는 ReferenceElementId가 있는 추출 행에서만 Reload From 또는 삭제할 수 있고, 신규 링크는 같은 호스트의 행을 복사해 Action으로 구분합니다.',
        '추출 결과는 기본 Action=유지이며 대상 경로가 비어 있다는 이유만으로 링크를 삭제하지 않습니다.',
        '실제 링크 변경이 필요한 타입/인스턴스만 요소 소유권을 확인하고, 저장 뒤 TransmissionData로 결과를 다시 확인합니다.'
      ],
      result: [
        '적용 뒤 결과 표는 결과, 대상(호스트·링크), 작업, 원인·조치 네 열로 보여 주며 유지/단순 건너뜀 행은 숨깁니다.',
        '오류나 주의 행은 먼저 원인·조치를 확인하고, 필요한 경우 기술 상세에서 Revit 원문과 현재/대상 경로·웍셋을 확인합니다.',
        'Excel에는 Action, 호스트·링크 식별 정보, 현재 경로·상태, 대상 경로·웍셋, 적용 상태와 메시지가 함께 저장됩니다.'
      ],
      export: {
        multi: false,
        single: 'RevitLinkPath_yyyyMMdd_HHmm.xlsx',
        splitKo: '',
        splitEn: '',
        note: '링크 추출 결과를 한 파일로 저장하고, 그 파일을 기준으로 재지정합니다.'
      }
    },
    {
      id: 'linksharedcoord',
      group: '유틸리티',
      title: 'Link 파일 Shared Coordination 검토/설정',
      badge: '별도 화면',
      summary: '활성 문서 또는 여러 RVT의 Revit 링크를 검토하고, 현재 Shared Site·Transform 정보를 Excel 검토표에서 확인한 뒤 APPLY 행만 안전하게 반영합니다.',
      target: '현재 활성 호스트 문서 또는 RVT 등록 창에서 고른 Revit 프로젝트 파일의 직접 로드 링크입니다.',
      userGuide: '기본 작업은 Excel 일괄 검토/설정입니다. 링크 상태를 읽어 검토 Excel을 만든 뒤 Action 열에서 APPLY할 행만 지정하고 다시 불러오면, 현재 상태를 다시 검증한 후 호스트 링크 배치를 반영합니다. 활성 문서 단일 링크 모드에서는 기존처럼 Grid/Level 기준으로 분석·적용·Publish를 별도로 진행할 수 있습니다.',
      setupLead: '여러 파일을 다룰 때는 Excel 일괄 검토/설정을 먼저 사용하고, 한 호스트의 좌표 관계를 직접 조정할 때만 활성 문서 단일 링크 모드로 전환합니다.',
      setup: [
        'Excel 일괄 검토/설정에서는 활성 문서를 검토하거나 RVT 등록 창에서 여러 파일을 추가합니다. 여러 RVT는 사용자 웍셋을 열지 않는 상태로 한 파일씩 읽습니다.',
        '검토가 끝나면 Excel 내보내기로 행별 상태를 저장합니다. 노란색 Action 열은 REVIEW, APPLY, SKIP 중 하나로 설정하며, 실제 반영은 APPLY 행만 대상입니다.',
        '현재 작업 기준에서 활성 호스트 문서와 Project Location을 확인합니다. 패밀리 문서, 링크 문서 자체, 읽기 전용 상태에서는 실행할 수 없습니다.',
        '링크와 기준 앵커에서 호스트에 직접 로드된 최상위 Revit 링크를 선택하고 Anchor Grid 두 개와 기준 Level을 고릅니다. 기본 예시는 A × 1 교차점과 1FL입니다.',
        '방향 기준은 두 번째 교차점 또는 Project North 중 선택합니다. 두 번째 교차점은 방향 Grid 두 개를 추가로 선택해 180° 방향 모호성을 없애므로 일반적으로 더 안전합니다.',
        '목표 Shared Coordination은 링크 저장 Shared Site 또는 직접 입력을 선택합니다. 저장 Site를 쓸 때는 링크 안의 Named Position/Site를 고르고, 직접 입력은 E, N, Z와 Bearing(CW+)을 mm 또는 m 단위로 입력합니다.',
        '직접 입력을 사용해도 Publish할 목적 Site는 필요합니다. 분석 결과의 현재값, 목표값, 차이를 확인한 뒤에만 적용과 Publish 버튼이 활성화됩니다.'
      ],
      settingDetails: [
        {
          label: 'Excel 일괄 검토/설정',
          description: '활성 문서 또는 여러 RVT의 링크를 먼저 읽고, 검토 결과와 적용 후보를 하나의 Excel로 내보냅니다. 결과를 읽는 단계에서는 모델을 변경하지 않습니다.',
          example: '건축·구조·설비 RVT 3개를 등록해 여러 RVT 검토를 실행한 뒤, 링크별 현재 SITE와 배치 상태가 담긴 검토 Excel을 만듭니다.'
        },
        {
          label: 'Action 열과 검토 Excel 다시 불러오기',
          description: 'Excel의 Action은 REVIEW, APPLY, SKIP만 허용합니다. 행을 삭제하거나 숨김 식별 열을 바꾸지 말고, 반영할 링크만 APPLY로 바꾼 뒤 저장하여 다시 불러옵니다.',
          example: '건축 링크 한 행만 APPLY로 바꾸고 나머지는 REVIEW로 유지하면, 다시 불러온 뒤 건축 링크만 반영 후보가 됩니다.'
        },
        {
          label: 'SITE와 배치 정보',
          description: 'OriginalPlacementMethod는 최초 링크 옵션을 Revit API가 되읽을 수 없어 확인 불가로 표시합니다. 대신 현재 배치 추정, 인스턴스 Shared Site, 링크 파일의 Active Project Location을 구분해 보여줍니다.',
          example: 'Instance Shared Site가 A동_A1이고 Link Active Site가 Internal이면 두 값이 다른 성격의 정보임을 확인한 뒤 좌표 관계를 판단합니다.'
        },
        {
          label: 'Anchor Grid와 기준 Level',
          description: '링크 내부의 두 Grid 교차점과 Level 높이를 하나의 기준점으로 사용합니다.',
          example: 'Anchor Grid A와 1, Level 1FL을 선택하면 A × 1 교차점의 1FL 높이를 배치 기준점으로 계산합니다.'
        },
        {
          label: '두 번째 교차점',
          description: '첫 기준점에서 어느 방향을 앞쪽으로 볼지 추가 Grid 교차점으로 정합니다.',
          example: 'A × 1을 기준점으로 두고 A × 2를 방향점으로 선택하면 1에서 2로 향하는 축을 사용합니다.'
        },
        {
          label: 'Project North',
          description: '추가 교차점 대신 링크의 Project North 방향을 사용합니다. 선택 Grid가 Project North와 평행하지 않으면 경고를 확인해야 합니다.',
          example: '정방향으로 작성된 링크처럼 Grid A가 Project North와 확실히 평행한 경우에 사용합니다.'
        },
        {
          label: '링크 저장 Shared Site',
          description: '링크 파일에 저장된 Named Position/Site의 E, N, Z와 Bearing을 목표값으로 사용합니다.',
          example: 'A동_건축.rvt의 A동_A1 Site를 선택해 현재 호스트 배치와 저장 좌표를 비교합니다.'
        },
        {
          label: '직접 입력',
          description: '목표 E/N/Z와 시계 방향 Bearing을 숫자로 입력합니다. 모든 칸이 유효한 숫자여야 합니다.',
          example: '단위 mm에서 E 125000, N 83000, Z 0, Bearing 12.5를 입력합니다.'
        },
        {
          label: '분석·적용·Publish',
          description: '분석은 읽기 전용 계산, 적용은 호스트 링크 인스턴스 이동·회전, Publish는 링크 파일에 좌표 관계를 기록하고 저장하는 별도 단계입니다.',
          example: '먼저 분석해 잔차를 확인하고 호스트 링크 배치 적용을 실행한 뒤, 승인된 경우에만 확인 체크 후 Publish를 실행합니다.'
        }
      ],
      run: [
        'Excel 일괄 검토/설정에서는 활성 문서 검토 또는 여러 RVT 검토를 선택합니다. 여러 RVT는 등록 목록에서 체크한 파일만 순서대로 읽습니다.',
        '검토 결과에서 Link Instance, Instance Shared Site, Link Active Site, 현재 배치 추정, 경고와 적용 가능 여부를 확인하고 Excel 내보내기를 누릅니다.',
        '검토 Excel에서 Action을 REVIEW, APPLY, SKIP으로 정합니다. 행 삭제, 숨김 식별 열 수정, 수식 입력은 허용되지 않습니다.',
        '선택한 Excel 다시 불러오기를 누르면 파일 해시와 현재 모델 상태를 다시 검증합니다. 통과한 APPLY 행만 APPLY 행 적용 버튼으로 실행합니다.',
        '활성 호스트, 링크, Anchor Grid 두 개, 기준 Level과 방향 기준을 선택합니다. 두 번째 교차점 방식이면 방향 Grid 두 개도 선택합니다.',
        '목표 출처와 Site 또는 직접 입력값을 정한 뒤 Shared Coordination 분석을 누릅니다. 이 단계는 문서를 변경하지 않습니다.',
        '분석 결과에서 현재/목표/차이의 E, N, Z, Bearing과 경고를 확인합니다. 기본 검증 허용값은 거리 1.0 mm, 각도 0.001°입니다.',
        '호스트의 링크 인스턴스를 목표 위치로 맞추려면 호스트 링크 배치 적용을 실행합니다. 회전 후 이동하고 남은 차이를 다시 검증합니다.',
        '좌표 관계를 링크 파일에 기록해야 할 때만 Publish 확인을 체크하고 Publish + Link 파일 저장을 실행합니다. Cloud 링크는 분석과 호스트 배치만 가능하고 Publish는 지원하지 않습니다.'
      ],
      logic: [
        '최초 링크 Positioning 방식은 Revit API가 기존 인스턴스에서 제공하지 않으므로 결과에서 확인 불가로 명시합니다. 현재 Transform과 Shared Site 관계로 보이는 현재 배치만 추정으로 표시합니다.',
        '링크 인스턴스의 GEO_LOCATION에서 Instance Shared Site를 읽고, 열 수 있는 링크 파일에서는 활성 Project Location을 별도 값으로 기록합니다.',
        '여러 RVT 검토는 파일을 하나씩 열고 사용자 웍셋을 열지 않습니다. 닫힌 웍셋 때문에 인스턴스 정보를 읽지 못한 경우에는 값을 추정하지 않고 정보 없음과 사유를 남깁니다.',
        'Excel 가져오기와 재검토 단계는 모델을 바꾸지 않으며, 내보낸 행의 식별 정보와 현재 모델 지문이 다르면 APPLY를 차단합니다.',
        '활성 UIDocument의 호스트 문서를 기준으로 직접 로드된 최상위 RevitLinkInstance만 수집합니다. 중첩 링크와 Forma Scenario는 대상에서 제외합니다.',
        '선택한 Grid 교차점과 Level ProjectElevation으로 링크 내부 기준점을 만들고, 현재 링크 Transform을 적용해 호스트 좌표를 계산합니다.',
        '두 번째 교차점 또는 Project North로 방향 벡터를 만든 뒤 현재 배치의 E/N/Z/Bearing과 목표 Site 값을 비교합니다.',
        '적용은 호스트 문서에서 링크를 회전한 다음 이동하고, 계산된 잔차가 허용값 안인지 다시 확인합니다.',
        'Publish는 hostDocument.PublishCoordinates를 사용해 선택 Site에 좌표 관계를 기록하고 링크 위치와 파일을 저장합니다.',
        '기존 Save Positions 대기 상태, 읽기 전용, 지원하지 않는 링크, 경고/오류가 발생하면 작업을 중단하고 Transaction을 되돌립니다.'
      ],
      result: [
        'Excel 일괄 검토 결과에는 Host File, Link Instance, Original Placement Method, Current Placement Method, Instance Shared Site, Link Active Site, 워크셋·파일 상태와 경고가 포함됩니다.',
        'Original Placement Method가 확인 불가인 것은 오류가 아니라 Revit API가 최초 배치 이력을 제공하지 않는다는 뜻입니다.',
        'APPLY 전 재검토에서 링크, 좌표 기준, 파일 지문이 바뀌었거나 적용 불가 상태면 해당 행은 차단되고 사유가 표시됩니다.',
        '분석 화면에 현재값, 목표값, 차이값의 E, N, Z, Bearing을 나란히 표시합니다.',
        '분석 경고, 적용 가능 여부, Publish 가능 여부를 확인할 수 있습니다.',
        '이 기능은 결과 Excel을 만들지 않습니다. 문서 변경은 사용자가 별도로 적용 또는 Publish를 실행한 경우에만 발생합니다.'
      ],
      export: {
        workflow: true,
        title: '검토 Excel',
        steps: [
          'Excel 양식 예시는 열 구성을 확인하기 위한 샘플 파일이며 실제 적용 데이터로 사용할 수 없습니다.',
          '활성 문서 검토 또는 여러 RVT 검토가 끝나면 Excel 내보내기로 검토 행을 새 파일에 저장합니다. 기본 파일명은 LinkSharedCoord_yyyyMMdd_HHmmss.xlsx입니다.',
          '검토 Excel의 노란색 Action 열에서 APPLY할 행만 지정하고 저장합니다. 행을 삭제하지 말고 REVIEW 또는 SKIP으로 남겨야 합니다.',
          '선택한 Excel 다시 불러오기로 재검토를 통과한 뒤 APPLY 행 적용을 실행합니다.'
        ],
        note: '이 Excel은 단순 결과 파일이 아니라 검토와 적용 사이의 안전한 작업표입니다. 숨김 식별 열, 기준 행과 수식 셀을 수정하면 가져오기가 거부됩니다.'
      },
      excelOutputVisuals: false,
      notes: [
        '분석 결과를 확인하기 전에는 적용하거나 Publish하지 않습니다. Publish는 링크 파일에 좌표 관계를 기록하는 작업입니다.',
        '기존 링크가 다른 Shared Site에 묶여 Save Positions 대기 상태가 생기면 적용이 롤백될 수 있습니다. 필요한 경우 Revit에서 링크 위치를 <Not Shared>로 정리한 뒤 다시 시도합니다.',
        'Cloud 링크는 Publish할 수 없고 Forma Scenario 링크는 읽기 전용 대상이라 이 기능에서 제외됩니다.'
      ]
    },
    {
      id: 'lateralnozzle',
      group: '유틸리티',
      title: '노즐코드 KTA 단일화',
      badge: '별도 화면',
      summary: '여러 KTA 엑셀에서 UT명, 배관No, Nozzle Code, No 정보를 찾아 하나의 양식으로 정리합니다.',
      target: '엑셀 파일 등록 후 실행하는 별도 화면 기능입니다.',
      setup: [
        '검토할 xlsx 또는 xls 파일을 등록합니다.',
        '파일 목록에서 실행 대상 파일을 선택합니다.'
      ],
      run: [
        '추출 시작을 누르면 각 파일의 모든 시트를 검사합니다.',
        '처리 완료 후 결과 엑셀을 저장합니다.'
      ],
      logic: [
        '각 시트에서 UT명, 배관No, Nozzle Code, No 헤더 블록을 찾습니다.',
        'Nozzle Code와 No 값을 이어 하나의 결과 값으로 정리합니다.',
        'Nozzle Code는 No 값을 _로 이어 만들고, 최종 Nozzle Code는 _000 형태의 숫자 3자리로 끝나는지 확인합니다.',
        '형식이 맞지 않으면 비교 형식 불일치로 표시합니다.'
      ],
      result: [
        '처리 파일 수, 추출 건수, 비교 건수가 표시됩니다.',
        '엑셀에는 정리된 KTA 결과와 형식 불일치 항목이 저장됩니다.'
      ],
      export: {
        multi: false,
        single: '사용자가 저장 위치와 파일명을 선택합니다.',
        splitKo: '',
        splitEn: '',
        note: '이 기능은 엑셀 원본 정리 도구라 RVT 파일별 저장 규칙을 사용하지 않습니다.'
      }
    },
    {
      id: 'guid',
      group: '유틸리티',
      title: '파라미터 GUID 검토 및 정리',
      badge: '별도 화면',
      summary: '프로젝트와 패밀리 파라미터 GUID를 검토하고 삭제용 엑셀 기준으로 정리합니다.',
      target: 'RVT 등록 후 GUID 검토와 정리를 수행하는 별도 화면 기능입니다.',
      setup: [
        'RVT 파일을 등록합니다. 목록이 비어 있으면 활성 문서 기준 검토도 사용할 수 있습니다.',
        '패밀리 포함 여부와 주석 패밀리 포함 여부를 설정합니다.',
        '삭제용 엑셀을 사용하려면 검토 결과를 먼저 내보낸 뒤 삭제 여부를 입력합니다.'
      ],
      run: [
        '검토 시작으로 GUID 결과를 생성합니다.',
        '삭제용 엑셀 내보내기, 삭제용 엑셀 불러오기, 정리 시작 순서로 정리합니다.'
      ],
      logic: [
        '프로젝트 파라미터와 패밀리 파라미터의 이름, GUID, 바인딩 상태를 수집합니다.',
        '동일 이름/다른 GUID, GUID 누락, 정리 대상 여부를 결과로 기록합니다.',
        '삭제용 엑셀의 삭제여부 열에 표시된 행만 정리 대상으로 적용합니다.'
      ],
      result: [
        'RVT 검토결과와 Family 검토결과가 분리되어 표시됩니다.',
        '엑셀에는 파라미터명, GUID, 바인딩, 삭제여부, 정리 상태가 저장됩니다.'
      ],
      export: {
        multi: false,
        single: 'GuidAudit_yyyyMMdd_HHmm.xlsx',
        splitKo: '파라미터GUID검토',
        splitEn: '파라미터GUID검토',
        note: '공통 배치 결과에서 저장할 경우 파일별 {RVT파일명}_파라미터GUID검토_00EA.xlsx 형식을 사용합니다.'
      }
    },
    {
      id: 'tapdepthutility',
      group: '유틸리티',
      title: 'Tap, Saddle 모델링 검토 (묻힘)',
      badge: '배치 선택',
      summary: '유틸리티 그룹에서 활성/선택 RVT의 Tap/Saddle 묻힘 깊이를 검토합니다.',
      target: '활성 문서와 여러 RVT 검토를 지원합니다.',
      setup: [
        '묻힘 허용값, 단위, 추가 출력 옵션을 설정합니다.',
        '필요하면 공통 필터와 제외 조건을 적용합니다.'
      ],
      run: [
        '활성 문서 또는 여러 RVT 검토를 실행합니다.',
        'BQC의 Tap, Saddle 묻힘 검토와 같은 판정 로직을 사용합니다.'
      ],
      logic: [
        'Tap/Saddle 객체의 삽입 깊이를 계산합니다.',
        'Takeoff Length 기준과 비교해 허용 범위 초과 여부를 판정합니다.',
        '선택한 좌표/선형 옵션을 결과에 추가합니다.'
      ],
      result: [
        '묻힘 오류 건수와 정상 건수를 표시합니다.',
        '엑셀에는 기준 길이, 실제 깊이, 차이, 판정 결과가 저장됩니다.'
      ],
      export: {
        multi: true,
        single: 'TapDepth_Selected {N} Files.xlsx 또는 TapDepth_yyyyMMdd_HHmm.xlsx',
        splitKo: 'Tap Saddle 묻힘 검토',
        splitEn: 'Tap Saddle Embed Review'
      }
    },
    {
      id: 'familylink',
      group: '유틸리티',
      title: '패밀리 공유파라미터 연동 검토',
      badge: '배치 선택',
      summary: '복합 패밀리와 하위 패밀리 사이의 공유파라미터 연동 상태를 검토합니다.',
      target: '활성 문서와 여러 RVT 검토를 지원합니다.',
      setup: [
        '검토할 공유파라미터를 선택합니다.',
        '단일 패밀리 파라미터 추가 여부를 검토할지 선택합니다.',
        '공유파라미터 목록은 Revit에 연결된 TXT에서 자동으로 읽습니다.'
      ],
      run: [
        '설정 완료 후 대상 문서 검토를 실행합니다.',
        '선택 파라미터만 패밀리 연동 검토 대상으로 사용합니다.'
      ],
      logic: [
        '복합 패밀리와 하위 패밀리 구조를 분석합니다.',
        '선택한 공유파라미터가 하위 패밀리에 존재하는지 확인합니다.',
        '상위-하위 패밀리 간 파라미터 연동이 없거나 잘못된 경우 오류로 기록합니다.'
      ],
      result: [
        '연동 누락, 파라미터 없음, 정상 건수를 표시합니다.',
        '엑셀에는 파일, 패밀리, 하위 패밀리, 파라미터명, 연동 상태가 저장됩니다.'
      ],
      export: {
        multi: true,
        single: 'FamilyLinkAudit_yyyyMMdd_HHmm.xlsx',
        splitKo: '패밀리공유파라미터연동검토',
        splitEn: '패밀리공유파라미터연동검토'
      },
      notes: [sharedParamNote]
    },
    {
      id: 'points',
      group: '유틸리티',
      title: '기준점/북각 추출',
      badge: '배치 선택',
      summary: 'RVT의 프로젝트 기준점, 측량 기준점, 내부 원점 공유좌표, 프로젝트 북각 값을 추출합니다.',
      target: '활성 문서 또는 여러 RVT 검토를 지원합니다.',
      setup: [
        '별도 상세 설정 없이 대상 문서를 선택합니다.',
        '여러 파일을 비교하려면 RVT 등록 창에서 파일을 추가합니다.'
      ],
      run: [
        '활성 문서 검토 또는 여러 RVT 검토를 실행합니다.',
        '결과를 확인하고 엑셀로 저장합니다.'
      ],
      logic: [
        '각 문서의 프로젝트 기준점, 측량 기준점, 내부 원점 공유좌표를 읽습니다.',
        '좌표와 북각 값을 현재 프로젝트 기준으로 정리합니다.',
        '읽을 수 없는 값은 빈 값 또는 오류 상태로 기록합니다.'
      ],
      result: [
        '파일별 기준점/북각 값이 표로 표시됩니다.',
        '엑셀에는 파일명, 프로젝트 기준점 좌표, 측량 기준점 좌표, 내부 원점 공유좌표, 북각이 저장됩니다.'
      ],
      export: {
        multi: true,
        single: 'Points_yyyyMMdd_HHmm.xlsx',
        splitKo: 'Point좌표추출',
        splitEn: 'Point좌표추출'
      }
    },
    {
      id: 'linkworkset',
      group: '유틸리티',
      title: '링크 기본 웍셋 점검/적용',
      badge: '배치 선택',
      summary: 'Revit 링크의 로드 상태와 열려 있는 웍셋을 확인하고 기본 웍셋만 열리도록 적용합니다.',
      target: '활성 문서 또는 여러 RVT 검토를 지원합니다.',
      setup: [
        '점검 모드 또는 적용 모드를 선택합니다.',
        '적용 기준 웍셋과 링크 처리 방식을 확인합니다.'
      ],
      run: [
        '점검만 실행하면 현재 링크 웍셋 상태를 기록합니다.',
        '적용 실행은 링크 타입의 열림 웍셋을 기본 웍셋 기준으로 재설정합니다.'
      ],
      logic: [
        '호스트 문서의 Revit 링크 타입과 인스턴스를 수집합니다.',
        '링크 로드 상태와 열려 있는 워크셋 목록을 확인합니다.',
        '적용 모드에서는 기본 웍셋만 열리도록 링크 로드 옵션을 갱신합니다.'
      ],
      result: [
        '링크 수, 변경 수, 오류 수가 표시됩니다.',
        '엑셀에는 호스트 파일, 링크명, 기존 상태, 적용 상태, 메시지가 저장됩니다.'
      ],
      export: {
        multi: true,
        single: 'LinkWorkset_yyyyMMdd_HHmm.xlsx',
        splitKo: '링크기본웍셋점검적용',
        splitEn: '링크기본웍셋점검적용'
      }
    },
    {
      id: 'sharedparambatch',
      group: '유틸리티',
      title: '프로젝트 파라미터 일괄 추가',
      badge: '별도 화면',
      summary: '여러 프로젝트 파일에 선택한 공유파라미터를 프로젝트 파라미터로 일괄 추가합니다.',
      target: '공유파라미터 선택, 카테고리 매핑, RVT 등록 후 실행하는 별도 화면 기능입니다.',
      setup: [
        'Revit에 연결된 공유파라미터 목록에서 추가할 파라미터를 선택합니다.',
        '카테고리와 인스턴스/타입 바인딩을 설정합니다.',
        'RVT 등록 창에서 적용 대상 파일을 추가합니다.'
      ],
      run: [
        '설정 일괄 적용 후 실행을 누릅니다.',
        '워크셰어링 파일은 모든 워크셋 닫고 열기와 동기화 코멘트 옵션을 확인합니다.'
      ],
      logic: [
        '공유파라미터 정의를 Revit SharedParametersFilename에서 읽습니다.',
        '선택 파라미터를 지정 카테고리에 인스턴스 또는 타입 바인딩으로 추가합니다.',
        '이미 등록된 파라미터는 중복 추가하지 않고 상태만 기록합니다.'
      ],
      result: [
        '추가됨, 이미 있음, 실패 건수가 표시됩니다.',
        '엑셀에는 파일, 파라미터명, GUID, 카테고리, 바인딩, 처리 상태가 저장됩니다.'
      ],
      export: {
        multi: false,
        single: 'SharedParamBatch_yyyyMMdd_HHmm.xlsx',
        splitKo: '',
        splitEn: '',
        note: '이 기능은 프로젝트 파라미터 일괄 추가 결과를 한 파일로 저장합니다.'
      },
      notes: [sharedParamNote]
    },
    {
      id: 'reducerpoint',
      group: 'BQC 검토',
      title: 'Reducer Point 정합성 검토',
      badge: '배치 선택',
      summary: 'Pipe Fittings의 Reducer 타입명과 Point 파라미터의 ECC/CON 표기가 서로 맞는지 검토합니다.',
      target: '활성 호스트 문서 또는 등록한 여러 RVT의 Pipe Fittings 중 패밀리명에 Reducer가 포함된 인스턴스입니다.',
      setup: [
        '이 기능은 별도 기준값을 입력하지 않습니다. Pipe Fittings 카테고리와 패밀리명 Reducer 조건이 자동으로 적용됩니다.',
        '공통 설정에서 포함/제외 필터를 추가하면 자동 대상 안에서도 검토 범위를 더 좁힐 수 있습니다.',
        '결과에 함께 확인할 파라미터가 있으면 공통 설정의 추가 파라미터에 등록합니다.'
      ],
      run: [
        'BQC 검토에서 Reducer Point 정합성 검토를 선택하고 설정 상태를 확인합니다.',
        '활성 문서 검토는 현재 Revit의 호스트 문서를 바로 검토합니다. 링크 문서는 대상이 아닙니다.',
        '여러 RVT 검토는 RVT 등록 창에서 파일을 추가하고, 체크된 파일만 실행합니다.',
        '결과창에서 오류와 정상 건수를 확인한 뒤 필요하면 엑셀 내보내기를 누릅니다.'
      ],
      logic: [
        'Pipe Fittings 중 패밀리명에 Reducer가 포함된 FamilyInstance만 수집합니다. 타입명만 Reducer인 객체는 대상이 아닙니다.',
        '타입명과 Point 파라미터에서 ECC 또는 CON 표기를 대소문자 구분 없이 찾습니다.',
        'Point는 인스턴스 파라미터를 먼저 읽고, 없으면 타입 파라미터를 읽습니다.',
        '두 표기가 다르거나 한쪽에만 표기가 있거나 하나의 값에서 ECC와 CON이 함께 발견되면 오류입니다.',
        '이 기능은 값을 수정하지 않고 판정과 결과 기록만 수행합니다.'
      ],
      result: [
        '대상 수, 오류 수, 정상 수가 결과 카드에 표시됩니다.',
        '오류 결과에는 RVT 파일, 카테고리, 패밀리, 타입, 요소 ID, 타입명, Point 값과 판정 사유가 기록됩니다.',
        '공통 설정의 추가 파라미터를 지정한 경우 해당 값도 오류 행에 함께 출력됩니다.',
        '오류가 없는 경우에도 전체 대상/정상 집계는 결과 카드에서 확인할 수 있습니다.'
      ],
      export: {
        multi: true,
        single: 'ReducerPointReview_yyyyMMdd_HHmm.xlsx',
        splitKo: 'Reducer Point 정합성 검토',
        splitEn: 'Reducer Point Consistency Review',
        note: '엑셀에는 오류로 판정된 항목만 저장됩니다. 같은 이름의 파일이 있으면 Revit이 파일명 뒤에 번호를 붙여 보존합니다.'
      },
      notes: [
        '패밀리명에 Reducer가 포함되지 않은 Pipe Fittings는 검토하지 않습니다.',
        'Point 값에 ECC와 CON이 모두 들어 있으면 어느 한 쪽으로 판단하지 않고 오류로 표시됩니다.',
        '타입명과 Point의 표기 규칙을 프로젝트 전체에서 먼저 통일해 두는 것이 좋습니다.'
      ]
    },
    {
      id: 'centralworkset',
      group: '유틸리티',
      title: '센트럴 파일생성, 웍셋 추가 Grid/Level, 3D 뷰 권한 적용',
      badge: '별도 화면',
      summary: '같은 입력 화면에서 저장 경로를 입력하면 새 센트럴을 만들고, 비우면 기존 또는 연결 센트럴에 Grid/Level 및 지정 3D 뷰 권한만 적용하는 대량 작업 기능입니다.',
      target: '현재 활성 호스트 문서 또는 RVT 등록 창에 추가한 센트럴·로컬·일반 Revit 프로젝트 파일입니다.',
      setup: [
        '작업창은 센트럴 생성·권한 적용과 웍셋만 확인·추가로 구분됩니다. 새 센트럴 생성과 기존 센트럴 권한 적용은 같은 입력 화면을 사용합니다.',
        '등록 뒤 파일 종류, 연결 센트럴, 기존 사용자 웍셋, 경고 상태를 확인합니다. 연결 센트럴 경로가 없는 로컬/복사본은 새 센트럴 생성에서는 경고로 처리할 수 있지만 웍셋 단독 작업은 할 수 없습니다.',
        '센트럴 저장 경로를 입력하면 원본과 분리된 새 센트럴을 만듭니다. 경로를 비우면 새 파일을 만들지 않고 등록한 기존 센트럴 또는 로컬의 연결 센트럴에 선택한 권한만 적용합니다.',
        '3D 뷰, 3D 뷰 템플릿과 그리드·레벨 권한은 새 센트럴과 기존 센트럴에 같은 옵션으로 설정합니다. 그리드·레벨 옵션 하나가 본문 요소 Pin과 Shared Levels and Grids 웍셋의 Owner/Editable 확보를 함께 처리합니다.',
        '추가할 사용자 웍셋은 한 줄에 하나 또는 세미콜론(;)으로 구분해 입력합니다. 기존 센트럴 권한 적용과 웍셋 추가는 한 행에서 함께 요청하지 말고 웍셋 전용 작업으로 나눕니다.',
        '여러 파일 설정은 Excel 2.0 양식으로 내보냅니다. 보이는 입력 헤더는 한글이며, 실행 여부가 APPLY인 행만 다시 불러와 실행합니다.',
        '기존 출력 파일 덮어쓰기는 기본 OFF입니다. 같은 이름의 대상 파일을 교체해야 할 때만 켜고 확인 창에서 경로를 다시 검토합니다.'
      ],
      run: [
        '센트럴 생성·권한 적용 화면에서 파일별 웍셋과 권한을 입력합니다. 새 센트럴이면 센트럴 저장 경로를 입력하고, 기존 센트럴 권한만 적용하려면 경로를 비웁니다.',
        '이미 존재하는 센트럴에 웍셋만 넣을 때는 웍셋만 확인·추가 탭으로 전환한 뒤 웍셋 추가 실행을 누릅니다. 일반 RVT는 먼저 새 센트럴을 만들어야 합니다.',
        '한 번 실행할 행은 센트럴 저장 경로를 모두 입력하거나 모두 비워야 합니다. 새 센트럴 생성 행과 기존 센트럴 권한 행은 두 번으로 나누어 실행합니다.',
        '실행 전 오른쪽 준비 상태에서 파일 등록, 센트럴 경로, 웍셋과 권한 입력의 확인 필요 항목이 없는지 확인합니다.',
        '완료 요약에서 생성 센트럴, 새로 추가된 웍셋, 건너뛴 웍셋, 3D 뷰·템플릿과 그리드·레벨 권한 적용 결과를 확인합니다.'
      ],
      logic: [
        '기능은 원본 경로에 작업 내용을 Save/SaveAs하지 않습니다. 센트럴·로컬·복사본은 웍셋 유지 Detach와 모든 사용자 웍셋 닫기 상태로 열어 새 경로에 SaveAsCentral 합니다.',
        '일반 RVT는 새 센트럴 생성 과정에서 워크셰어링을 활성화합니다. 기존 연결 센트럴을 찾지 못하는 복사본도 등록한 파일 자체를 분리해 새 센트럴 생성은 계속할 수 있습니다.',
        '웍셋 단독 단계는 실제 연결 센트럴을 대상으로만 열고, 기존 이름과 대소문자까지 같은 이름은 만들지 않습니다.',
        '센트럴 저장 경로가 비어 있으면 등록한 기존 센트럴 또는 로컬의 연결 센트럴을 대상으로 열고, 선택한 권한만 적용한 뒤 동기화합니다.',
        '매핑 드라이브와 UNC처럼 경로 표기가 달라도 Windows 파일 ID가 같은 기존 파일이면 같은 센트럴로 판단합니다. 파일 ID를 확인할 수 없거나 서로 다른 파일이면 작업을 계속하지 않습니다.',
        '사전 검증 뒤 원본 RVT의 저장된 센트럴 연결과 실제로 연 임시 로컬의 연결 센트럴을 다시 확인합니다. 다른 실제 파일로 바뀌었다면 소유권 변경·로컬 생성·저장을 시작하기 전에 차단합니다.',
        '3D 뷰와 3D 뷰 템플릿은 정확히 일치하는 이름의 ViewWorkset을 현재 사용자 Owner/Editable 상태로 확보합니다. 그리드·레벨 옵션은 본문 Grid/Level을 Pin하고 exact-name Shared Levels and Grids 사용자 웍셋을 같은 상태로 확보합니다.',
        '패밀리 문서, 클라우드/서버 모델, 현재 Revit보다 높은 형식, 같은 원본·센트럴 경로로의 출력은 실행 전에 제외하거나 실패로 기록합니다.'
      ],
      result: [
        '파일별 새 센트럴 생성 또는 기존 센트럴 권한 적용의 성공/실패/건너뜀 상태와 실제 대상 경로를 확인할 수 있습니다.',
        '기존에 이미 있던 웍셋은 건너뜀으로 구분되고, 권한 옵션을 사용한 경우 3D 뷰·템플릿과 그리드·레벨의 실제 확보 결과를 함께 표시합니다.',
        '저장 상태를 자동으로 확정하지 못한 파일은 수동 확인 필요로 남습니다. 원본과 출력 RVT를 직접 확인한 뒤 파일을 새로 등록해 재시도합니다.'
      ],
      export: {
        available: false,
        title: 'Excel 2.0 일괄 설정',
        note: '검토 결과가 아니라 작업 설정을 주고받는 양식입니다. 보이는 헤더는 실행 여부, 원본 RVT, 기존 웍셋, 센트럴 저장 경로 (비우면 권한만 적용), 추가 웍셋 1~N, 3D 뷰·템플릿 권한/이름, 그리드·레벨 핀 + 웍셋 권한입니다.'
      },
      excelOutputVisuals: false,
      notes: [
        '새 센트럴 출력 경로는 원본과 다른 위치를 사용하고, 덮어쓰기는 파일명이 확실할 때만 켭니다. 기존 센트럴 권한 적용에서는 경로를 비웁니다.',
        '매핑 드라이브와 UNC가 같은 센트럴을 가리키더라도 실행 계정이 두 경로 모두에 접근할 수 있어야 실제 파일 확인이 가능합니다. 확인이 안 되면 안전을 위해 실패로 처리합니다.',
        '원본이 열려 있거나 다른 사용자가 작업 중인 워크셰어링 파일은 파일 상태에 따라 처리하지 못할 수 있습니다.',
        '웍셋 이름은 세미콜론으로 구분하며, 빈 이름과 이미 존재하는 이름은 추가하지 않습니다.'
      ]
    },
    {
      id: 'acccloud',
      group: '유틸리티',
      title: 'ACC 클라우드 모델 생성 (TEST)',
      badge: '별도 화면 · TEST',
      summary: '파일 기반 RVT를 지정한 ACC/Autodesk Docs 테스트 폴더에 별도의 Cloud Workshared 모델로 만드는 테스트 작업입니다. 기존 클라우드 모델을 덮어쓰거나 수정하지 않습니다.',
      target: '파일 기반 RVT와 테스트 전용 ACC/Autodesk Docs 대상입니다. 실행은 Revit 2023, 2025, 2027에서만 지원합니다.',
      userGuide: 'ACC 클라우드 모델 생성은 파일 RVT를 새 ACC Cloud Workshared 모델로 만드는 테스트 기능입니다. 한 작업 행은 하나의 원본 RVT와 하나의 ACC 대상 폴더를 뜻합니다. 실제 ACC 프로젝트에 새 모델을 만들 수 있으므로 운영 프로젝트가 아니라 전용 테스트 project/folder에서만 사용해야 합니다. 기존 센트럴/웍셋 생성 흐름과 달리 기존 ACC 모델을 찾아 덮어쓰지 않으며, 원격 생성 결과가 확실하지 않은 대상은 즉시 재실행하지 못하도록 잠급니다.',
      setupLead: '먼저 테스트용 ACC project와 folder를 정한 뒤 원본 RVT를 추가한다. 각 행에 생성할 모델명과 AccountGuid, ProjectGuid, FolderId/URN, Region을 입력하고, 여러 작업이 필요하면 행 복사 또는 요청 Excel을 사용한다.',
      setup: [
        'RVT 파일 추가로 원본 파일을 목록에 넣습니다. 같은 원본을 다른 ACC 대상으로 만들 때는 선택 행 복사 또는 요청 Excel을 사용합니다.',
        '각 행에서 Action, 생성 모델명, AccountGuid, ProjectGuid, FolderId/URN, Region과 추가할 사용자 웍셋을 확인합니다.',
        'ACC Excel 불러오기 또는 요청 양식 저장으로 여러 작업 행을 준비할 수 있습니다. 결과 전용 열은 직접 입력해도 실행 결과로 신뢰하지 않습니다.',
        'Cloud Workshared 생성은 TEST 대상에서만 실행하고, 원격 생성이 불확정인 행은 ACC에서 실제 모델 존재 여부를 먼저 확인합니다.'
      ],
      settingDetails: [
        {
          label: 'Source RVT와 작업 행',
          description: 'RVT 파일 추가는 같은 원본 경로를 한 번만 기본 등록합니다. 같은 파일을 건축·설비처럼 서로 다른 ACC 대상에 만들려면 선택 행 복사 또는 RowId를 유지한 요청 Excel 가져오기를 사용해야 합니다.',
          example: 'C:\\Seed\\Campus.rvt를 Architecture와 MEP 두 폴더에 만들려면 첫 행을 복사한 뒤 각 행의 Model Name과 FolderId를 다르게 입력합니다.'
        },
        {
          label: 'Action과 Model Name',
          description: 'Action은 APPLY 또는 SKIP만 사용합니다. APPLY 행만 원격 생성 대상으로 읽고, SKIP 행은 요청 양식에 남아 있어도 실행하지 않습니다. Model Name은 새 ACC 모델 이름이므로 원본 파일명과 달라도 됩니다.',
          example: 'Campus.rvt 한 행에서 Action=APPLY, Model Name=Campus_Architecture_TEST로 지정하면 해당 이름의 새 Cloud Workshared 모델 생성 요청을 만듭니다.'
        },
        {
          label: 'AccountGuid, ProjectGuid, FolderId/URN, Region',
          description: 'AccountGuid와 ProjectGuid는 GUID 형식으로, FolderId는 대상 Docs folder의 원문 ID/URN 전체로 입력합니다. Region은 원본 파일 위치가 아니라 대상 ACC project 기준으로 US 또는 EMEA를 선택합니다.',
          example: 'folder 값이 urn:adsk.wipprod:fs.folder:co.…라면 앞부분을 지우거나 GUID로 바꾸지 않고 원문 전체를 붙여 넣습니다.'
        },
        {
          label: 'Autodesk Docs URL 해석',
          description: '프로젝트 홈 URL과 대상 folder URL을 화면에 차례로 붙여 넣으면 화면 안에서 AccountGuid, ProjectGuid, FolderId를 읽어 현재 행에 채울 수 있습니다. URL은 로컬 화면에서만 해석하며 저장·전송·로그하지 않습니다.',
          example: '브라우저 주소의 프로젝트 URL을 먼저 붙여 넣고, 이어서 실제 대상 folder를 연 URL을 붙여 넣어 두 ID와 folder URN을 채웁니다.'
        },
        {
          label: '추가 사용자 웍셋',
          description: '새 Cloud Workshared 모델에 넣을 사용자 웍셋을 한 줄에 하나씩 입력합니다. 기존 이름과 정확히 같은 웍셋은 결과에서 건너뜀으로 기록됩니다.',
          example: 'Architecture와 Coordination을 두 줄로 입력하면 두 이름을 새 모델에 추가하도록 요청합니다.'
        },
        {
          label: '소유권, Pin 옵션과 TEST 실행 경계',
          description: '파일 센트럴의 CreateNewLocal 기반 소유권·Pin 규칙은 클라우드에 그대로 적용할 수 없어 1차 TEST 기능에서는 항상 FALSE로 보냅니다. 원격 덮어쓰기는 하지 않고, 같은 ACC target은 이전 생성 성공 또는 생성 불확정 상태가 남아 있으면 다시 실행할 수 없습니다.',
          example: 'Excel에 3D 뷰 소유권 또는 Level/Grid 권한을 TRUE로 입력해도 가져오기가 차단됩니다. 같은 folder와 model name 조합에서 불확정 메시지가 나면 ACC에서 모델을 먼저 확인합니다.'
        },
        {
          label: '요청 Excel과 신뢰 결과 Excel',
          description: '요청 양식 저장은 입력한 작업 행을 ACC_Cloud_Jobs 시트로 저장합니다. 신뢰 결과 저장은 실제 실행 뒤 받은 행만 ACC_Cloud_Results 시트로 저장하며, 결과 열을 임의로 편집한 Excel은 실행 근거로 사용하지 않습니다.',
          example: '여러 project/folder 작업은 요청 Excel을 작성해 불러오고, 실행 뒤에는 신뢰 결과 Excel을 별도 보관해 생성된 Cloud model ID와 상태를 확인합니다.'
        }
      ],
      run: [
        '화면의 Revit 로그인 이름과 지원 상태를 확인합니다. Revit 2019와 2021에서는 이 기능의 실행이 차단됩니다.',
        'RVT 파일을 추가하고 각 APPLY 행의 Model Name, AccountGuid, ProjectGuid, FolderId/URN, Region을 채웁니다. 대상 folder가 테스트 전용인지 다시 확인합니다.',
        '작업이 많으면 요청 양식을 저장하거나 ACC Excel을 불러온 뒤, 실행 전 각 행의 Action과 target 조합을 다시 검토합니다.',
        'ACC Cloud Workshared 생성 (TEST)을 누르고 확인 창에서 대상 수와 테스트 경고를 확인합니다.',
        '배치는 전체 행을 검증한 뒤 순서대로 처리합니다. 첫 실행 실패가 나면 이후 행을 계속 밀어 넣지 않고 중단하므로, 결과 메시지를 확인한 뒤 수정합니다.',
        '완료 뒤 원격 모델 생성됨 또는 원격 생성 미확정 상태를 확인합니다. 미확정 행은 재시도 전에 ACC에서 실제 모델 존재 여부를 먼저 확인합니다.'
      ],
      logic: [
        '지원 Revit 버전, APPLY/SKIP 값, 원본 RVT, 모델명, GUID, folder URN과 Region을 먼저 검증합니다.',
        '같은 원본으로 여러 작업을 만들 수 있지만, 같은 AccountGuid·ProjectGuid·FolderId·Model Name 조합은 하나의 ACC target으로 보고 중복 실행을 차단합니다.',
        '각 APPLY 행은 새 Cloud Workshared 모델 생성 요청으로 처리합니다. 기존 원격 모델을 찾아 덮어쓰는 동작은 하지 않습니다.',
        '원격 생성 성공 행은 생성된 cloud 식별값과 새로 만든/건너뛴 웍셋을 결과로 남깁니다.',
        '통신 또는 원격 상태 때문에 생성 여부를 확정하지 못하면 MANUAL CLEANUP REQUIRED 상태로 남기고 해당 target을 잠급니다. 같은 행을 바로 재실행해 중복 모델을 만들지 않도록 하는 안전장치입니다.',
        '소유권·Pin·Level/Grid 권한 값은 이 TEST 기능에서 실행하지 않으며, 파일 센트럴 기능의 설정과 섞이지 않게 별도 계약으로 처리합니다.'
      ],
      result: [
        '행마다 상태, 메시지, 원격 생성 확정 여부, 생성된 cloud 식별값과 웍셋 처리 결과를 확인합니다.',
        '원격 생성됨으로 표시된 행만 신뢰 결과 Excel에 저장합니다. 결과 파일은 생성 요청 양식과 구분해 보관합니다.',
        '원격 생성 미확정 또는 MANUAL CLEANUP REQUIRED 행은 재실행하지 말고 ACC Docs에서 모델 존재 여부를 수동으로 확인합니다.'
      ],
      export: {
        workflow: true,
        title: 'ACC 요청 및 결과 Excel',
        steps: [
          '요청 양식 저장은 현재 작업 행을 ACC_Cloud_Jobs 시트로 저장합니다. 노란 입력 열의 Action, source, target ID, Region, Model Name과 AddWorksets만 수정합니다.',
          'ACC Excel 불러오기는 RowId와 요청 필드를 검증하고, 허용하지 않는 소유권/Pin 값과 불완전한 target을 차단합니다.',
          '신뢰 결과 저장은 실제 실행 뒤 확정된 결과 행을 ACC_Cloud_Results 시트로 저장합니다. 원격 생성이 미확정인 행은 결과 파일만으로 성공으로 간주하지 않습니다.'
        ],
        note: '이 기능의 Excel은 공통 검토 결과의 한글/영문·한 파일/파일별 4가지 저장 방식이 아닙니다. 요청 양식과 실행 결과를 분리해 저장하는 전용 ACC 작업표입니다.'
      },
      excelVisuals: false,
      notes: [
        '운영 ACC project 또는 운영 folder에는 사용하지 않습니다. 이 기능은 화면과 결과에 TEST로 표시되는 실험 단계의 생성 작업입니다.',
        'FolderId는 Docs folder의 원문 URN을 사용하고, ACC 백업 화면의 Hub/Project/Item ID와 서로 바꿔 넣지 않습니다.',
        '생성 여부가 불확정인 경우 원격 상태를 먼저 확인해야 합니다. 같은 target을 즉시 재실행하면 중복 모델이 생길 위험이 있습니다.'
      ]
    },
    {
      id: 'accbackup',
      group: '유틸리티',
      title: 'ACC 백업 (TEST)',
      badge: '별도 화면 · TEST',
      summary: 'LAN file-based central의 성공 SWC를 신호로 닫힌 local snapshot을 만들고, 별도 ACC 일반 RVT Item의 Version으로 보관하는 TEST 백업 작업입니다. RCW/C4R 모델 병합은 하지 않습니다.',
      target: 'LAN file-based central과 테스트 전용 ACC/Autodesk Docs의 ordinary RVT Item입니다. RCW/C4R Item은 대상에서 제외됩니다.',
      userGuide: 'ACC 백업은 열린 센트럴 파일을 직접 복사하거나 업로드하는 방식이 아니다. 성공한 Synchronize with Central 신호를 durable queue에 기록한 뒤, Revit API로 닫힌 staging snapshot을 만들고 검증된 일반 ACC RVT Item에 Version으로 보관하는 TEST 기능이다. 기본값은 dry-run이며, 실제 외부 write는 이 PC의 TEST write gate, profile의 dry-run 해제, 전용 테스트 folder 확인이 모두 충족될 때만 가능하다.',
      setupLead: '먼저 LAN file-based central을 하나 고르고 Autodesk 연결을 만든다. Hub → Project → Folder → ordinary RVT Item 순서로 대상 항목을 선택하고, dry-run 상태에서 profile과 queue 흐름을 먼저 확인한다.',
      setup: [
        '중앙 RVT 선택으로 LAN file-based central을 등록합니다. local, RCW/C4R, Desktop Connector 파일을 직접 백업 대상으로 쓰지 않습니다.',
        'Autodesk 연결로 시스템 브라우저 로그인을 완료하고, Hub·Project·Folder·ordinary RVT Item을 목록에서 순서대로 선택합니다.',
        '성공 SWC 기준의 debounce 시간과 최대 백업 간격을 확인하고, TEST Profile 저장 후 dry-run queue를 먼저 검토합니다.',
        '실제 ACC write는 전용 테스트 folder 확인, dry-run 해제, 이 PC의 TEST write gate가 모두 맞을 때만 허용합니다.'
      ],
      settingDetails: [
        {
          label: '중앙 RVT 선택',
          description: '백업 신호를 받을 LAN file-based central을 선택합니다. 이 기능은 열린 live central을 Save/SaveAs/Close하거나 직접 복사하지 않고, 성공 SWC 뒤에 생성한 닫힌 staging snapshot만 처리합니다.',
          example: 'C:\\Central\\Plant_A.rvt가 실제 file-based central이면 선택할 수 있습니다. 사용자가 열어 둔 Plant_A_local.rvt나 ACC RCW 모델은 source로 사용하지 않습니다.'
        },
        {
          label: 'Autodesk 연결',
          description: 'Autodesk 연결을 누르면 시스템 브라우저에서 로그인을 진행합니다. 연결 token은 Windows Credential Manager에만 저장하며, profile·queue·manifest에는 token 또는 signed URL을 기록하지 않습니다.',
          example: '테스트용 Autodesk 계정으로 로그인한 뒤 상태 새로고침을 눌러 현재 profile의 연결 상태가 표시되는지 확인합니다.'
        },
        {
          label: 'Hub, Project, Folder, Target Item 선택',
          description: 'Hub → Project → Top folder → Folder contents 순서로 목록을 조회해 고정할 ordinary RVT Item을 선택합니다. APS가 돌려준 원문 ID를 그대로 사용하고, RCW/C4R Item은 목록과 업로드 단계 모두에서 차단합니다.',
          example: '하위 folder를 선택했다면 Folder contents를 다시 눌러 해당 폴더의 ordinary RVT Item을 고릅니다. folder URN을 GUID처럼 잘라 입력하지 않습니다.'
        },
        {
          label: '성공 SWC 기준과 백업 간격',
          description: '기본 trigger는 successful-swc-debounced입니다. 짧은 시간에 여러 번 SWC가 발생해도 debounce 시간 안에서는 queue를 중복으로 쌓지 않고, 최대 백업 간격으로 너무 오래 백업이 밀리지 않게 합니다.',
          example: 'Debounce 10분, 최대 간격 30분이면 10분 안에 이어진 SWC는 한 작업으로 정리하고 마지막 확정 backup이 너무 오래 없으면 다음 eligible SWC에서 다시 처리합니다.'
        },
        {
          label: 'dry-run과 전용 테스트 folder 확인',
          description: '기본 dry-run은 snapshot, hash, queue와 계약 검증까지만 수행하고 외부 ACC Version을 만들지 않습니다. 실제 write는 profile에서 dry-run을 끄고 전용 테스트 folder 확인을 켠 뒤, 이 PC의 TEST write gate도 활성인 경우에만 허용합니다.',
          example: '운영 Docs folder를 고른 상태에서는 dry-run을 해제하지 않습니다. 전용 sandbox folder를 선택하고 테스트용 Item을 확인한 뒤에만 필요한 승인 절차를 진행합니다.'
        },
        {
          label: 'TEST Profile 저장과 상태 새로고침',
          description: 'Profile에는 source central, 대상 ACC Item, 간격과 TEST 옵션만 durable queue 설정으로 저장합니다. 저장 뒤 상태 새로고침으로 연결, profile, job과 write gate 상태를 다시 읽습니다.',
          example: 'source와 target을 바꾼 뒤에는 TEST Profile 저장을 다시 누르고, 저장된 profileId가 생긴 다음 TEST 백업 지금 실행을 사용합니다.'
        }
      ],
      run: [
        '중앙 RVT, Autodesk 연결, target ordinary RVT Item과 TEST 실행 모드를 모두 확인한 뒤 TEST Profile 저장을 누릅니다.',
        '처음에는 dry-run 상태로 TEST 백업 지금 실행을 눌러 queue, snapshot 준비와 receipt 화면의 흐름을 확인합니다.',
        '성공 SWC가 발생하면 callback은 작업을 durable queue에만 기록합니다. Revit API가 닫힌 staging snapshot을 준비한 뒤 별도 처리 단계에서 hash와 문서 식별값을 검사합니다.',
        '실제 write 조건이 모두 충족되지 않으면 job은 dry-run 검증으로 끝나며 ACC Version을 만들지 않습니다.',
        '실제 write가 허용된 TEST 환경에서는 ordinary RVT Item의 Version 생성 receipt가 확인된 뒤에만 백업 성공으로 봅니다.',
        'FAILED_MANUAL_ACTION 또는 AMBIGUOUS 상태는 화면의 재시도 버튼을 누르기 전에 target Item과 기존 Version을 먼저 확인합니다.'
      ],
      logic: [
        '성공 SWC callback은 queue에 후보만 추가합니다. live central을 직접 감시·복사하거나 현재 Revit 문서에 Save, SaveAs, Close를 호출하지 않습니다.',
        '처리 시 CreateNewLocal 결과의 닫힌 staging snapshot만 사용하고, snapshot의 central path, Revit format, DocumentVersion과 SHA-256을 원본과 대조합니다.',
        '같은 profile, source central, 문서 식별값과 hash 조합은 중복으로 보고 새 upload 없이 건너뜁니다.',
        'dry-run이거나 TEST write 승인 조건이 하나라도 부족하면 upload 단계로 가지 않고 dry-run 검증 상태로 남깁니다.',
        'upload 전에 target Item을 다시 확인하고 RCW/C4R이면 fail-closed로 중단합니다. 일반 RVT Item에서만 새 Version을 만들 수 있습니다.',
        'Version receipt를 확인한 job만 verified로 마감하고 성공한 staging snapshot은 정리합니다. 원격 상태가 애매하면 자동 성공으로 바꾸지 않고 수동 조치 상태로 남깁니다.'
      ],
      result: [
        '오른쪽 queue와 receipt에서 profile, source central, snapshot 준비, dry-run, upload, Version 확인 상태를 순서대로 확인합니다.',
        'dry-run은 외부 ACC Version이 만들어지지 않은 검증 결과입니다. Version receipt가 있어야 실제 백업 완료로 판단합니다.',
        '실패·수동 조치·애매한 상태는 메시지와 함께 남으며, 재시도 전 대상 Item과 기존 ACC Version을 먼저 확인해야 합니다.'
      ],
      export: {
        available: false,
        title: '백업 queue와 receipt',
        note: '이 기능은 공통 검토 결과 Excel을 만들지 않습니다. profile과 job receipt는 화면의 queue에서 확인하며, 성공 snapshot의 manifest는 token과 signed URL을 기록하지 않습니다.'
      },
      excelVisuals: false,
      notes: [
        '이 기능은 TEST 단계다. 운영 project/folder와 RCW/C4R 모델에는 사용하지 않습니다.',
        'staging snapshot은 host only일 수 있어 외부 Revit 링크, CAD, 이미지, keynote가 포함되지 않을 수 있습니다. 복구는 Detach and Preserve Worksets 후 새 LAN central 경로로 저장하는 방식으로 별도 확인합니다.',
        '백업 성공은 ACC Version receipt 확인을 뜻합니다. dry-run, queue 등록, snapshot 생성만으로는 원격 백업 완료가 아닙니다.'
      ]
    }
  ];

  const manualEnhancements = {
    reducerpoint: {
      userGuide: 'Reducer Point 정합성 검토는 배관 Reducer의 타입명 표기와 Point 파라미터의 ECC/CON 표기가 같은 의미인지 확인하는 BQC 기능입니다. 기준을 직접 입력하는 기능이 아니라, 프로젝트에 이미 들어 있는 Reducer 명명 규칙과 Point 값을 비교합니다.',
      setupLead: '판정 기준은 고정되어 있고, 필요한 경우 공통 설정으로 대상 범위와 결과 열만 조정합니다.',
      settingDetails: [
        {
          label: '자동 검토 대상',
          description: 'Pipe Fittings 중 패밀리명에 Reducer가 포함된 인스턴스만 자동으로 검토합니다. 다른 카테고리나 타입명만 Reducer인 객체는 대상이 아닙니다.',
          example: '패밀리명이 Pipe Reducer - Concentric인 피팅은 검토하지만, 일반 엘보 타입명에 Reducer라는 단어가 있는 경우는 검토하지 않습니다.'
        },
        {
          label: '타입명과 Point 비교',
          description: '타입명과 Point 값에서 ECC 또는 CON 문자열을 대소문자 구분 없이 찾아 같은 표기인지 비교합니다. Point는 인스턴스에서 먼저 찾고 없으면 타입 파라미터에서 찾습니다.',
          example: '타입명이 R-100x50 ECC이고 Point가 ECC라면 정상입니다. 타입명은 CON인데 Point가 ECC이면 오류입니다.'
        },
        {
          label: '판정 불가 값',
          description: '한쪽에만 ECC/CON이 있거나, 한 값에 ECC와 CON이 함께 있어 어느 하나로 판단할 수 없으면 오류로 기록합니다.',
          example: 'Point가 ECC/CON처럼 두 표기를 동시에 포함하면 자동 수정하지 않고 오류 행으로 남깁니다.'
        },
        {
          label: '공통 설정',
          description: '포함 필터와 제외 필터로 검토 범위를 더 좁히고, 추가 파라미터를 결과 행에 함께 출력할 수 있습니다.',
          example: '특정 System Type만 확인하려면 포함 필터를 추가하고, Line No를 추가 파라미터로 선택해 오류 엑셀에서 함께 확인합니다.'
        }
      ]
    },
    centralworkset: {
      userGuide: '새 센트럴 생성과 기존 센트럴 권한 적용은 같은 설정을 사용합니다. 센트럴 저장 경로를 입력하면 새 센트럴을 만들고, 비우면 등록한 기존 센트럴 또는 로컬의 연결 센트럴에 Grid/Level과 지정 3D 뷰·템플릿 권한만 적용합니다. 모델 원본은 결과 파일로 덮어쓰지 않습니다.',
      setupLead: '파일을 등록한 뒤 같은 권한 옵션을 입력하고 센트럴 저장 경로만으로 작업을 구분한다. 경로 입력은 새 센트럴 생성, 경로 비움은 기존 센트럴 권한 적용이다.',
      settingDetails: [
        {
          label: '작업 구분은 저장 경로로 자동 판단',
          description: '별도 권한 탭을 고르지 않는다. 센트럴 저장 경로가 있으면 새 센트럴 생성, 비어 있으면 기존 또는 연결 센트럴 권한 적용으로 자동 판단한다. 웍셋만 추가할 때만 웍셋 전용 화면을 사용한다.',
          example: 'D:\\Central_Output\\A.rvt를 입력하면 새 센트럴을 만들고, 같은 칸을 비우면 등록한 A_Central.rvt 또는 로컬의 연결 센트럴에 선택한 권한만 적용한다.'
        },
        {
          label: '대상 등록과 파일 상태',
          description: '활성 문서를 추가하거나 RVT 파일을 등록하면 센트럴/로컬/일반 여부, 현재 사용자 웍셋, 연결 센트럴, Revit 버전과 경고를 읽는다. 연결 센트럴 경로가 사라진 로컬·복사본은 새 센트럴 생성에서는 경고지만 실행 가능하다.',
          example: '복사해 둔 Campus_Local.rvt가 기존 센트럴 경로를 찾지 못해도 새 센트럴 생성으로 D:\\Central_Output\\Campus.rvt를 만들 수 있다. 같은 파일은 웍셋 단독 실행 대상으로는 쓸 수 없다.'
        },
        {
          label: '매핑 드라이브와 UNC 경로 확인',
          description: '원본 경로와 Revit 내부의 센트럴 경로 표기가 달라도 실제 Windows 파일 ID가 같으면 같은 파일로 인정한다. 실행 직전에도 연결 센트럴을 다시 읽으며, 확인할 수 없거나 다른 파일이면 변경 작업을 시작하지 않는다.',
          example: 'S:\\Project\\A_Central.rvt와 \\\\server\\share\\Project\\A_Central.rvt가 같은 파일 ID라면 정상적으로 이어서 처리한다. 같은 이름이어도 다른 파일 ID이거나 네트워크 접근 문제로 ID를 읽지 못하면 실패로 남긴다.'
        },
        {
          label: '센트럴 저장 경로',
          description: '새 센트럴을 만들 때만 원본과 기존 연결 센트럴이 아닌 절대 경로의 .rvt를 입력한다. 기존 센트럴에 권한만 적용할 때는 이 칸을 비운다. 한 배치에서 경로 입력 행과 빈 행을 섞을 수 없다.',
          example: 'D:\\Central_Output\\A동_설비.rvt를 입력하면 새 센트럴을 만들고, 빈칸이면 새 파일 없이 기존 센트럴 권한만 처리한다.'
        },
        {
          label: '추가할 사용자 웍셋',
          description: '한 줄에 하나 또는 세미콜론으로 여러 이름을 입력한다. 입력 개수 제한은 없으며, 앞뒤 공백을 뺀 뒤 대소문자까지 정확히 같은 기존 이름만 자동으로 건너뛴다. 괄호, 대괄호, 세미콜론 등 Revit 웍셋 이름에 쓸 수 없는 문자는 입력할 수 없다.',
          example: 'A-건축; S-구조; M-기계를 입력하면 기존 목록에 M-기계가 있을 때 A-건축과 S-구조만 새로 만든다. m-기계는 M-기계와 다른 이름으로 본다.'
        },
        {
          label: '3D 뷰와 템플릿 권한',
          description: '새 센트럴과 기존 센트럴에 같은 입력을 쓴다. 옵션을 켜고 이름을 한 줄에 하나씩 입력하면 대소문자·공백까지 정확히 일치하는 3D 뷰 또는 3D 뷰 템플릿의 ViewWorkset을 현재 Revit 사용자 Owner/Editable 상태로 확보한다.',
          example: 'Coordination 3D와 KKY Coordination Template을 각각의 이름 칸에 입력하면 선택한 두 ViewWorkset의 권한을 확보한다.'
        },
        {
          label: '그리드·레벨 핀 + 웍셋 권한',
          description: '옵션 하나로 링크를 제외한 본문 Grid/Level 요소를 Pin하고, 이름이 정확히 Shared Levels and Grids인 사용자 웍셋을 현재 Revit 사용자 Owner/Editable 상태로 확보한다. 새 센트럴과 기존 센트럴에 동일하게 적용한다.',
          example: '그리드와 레벨 고정 및 편집 권한이 모두 필요하면 이 옵션 하나만 켠다.'
        },
        {
          label: 'Excel 2.0 한글 설정표',
          description: 'RVT를 등록하면 바로 내보낼 수 있다. 보이는 입력 헤더는 실행 여부, 원본 RVT, 기존 웍셋, 센트럴 저장 경로 (비우면 권한만 적용), 추가 웍셋 1~N, 3D 뷰 권한/이름, 3D 뷰 템플릿 권한/이름, 그리드·레벨 핀 + 웍셋 권한이다. 행 ID와 자동 작업 방식 같은 기술 열은 숨겨진다.',
          example: '기존 센트럴 권한 작업은 센트럴 저장 경로를 비우고 필요한 권한 열만 TRUE로 작성한다. 새 센트럴 작업은 저장 경로를 입력하고 같은 권한 열을 그대로 사용한다.'
        },
        {
          label: '기존 파일 덮어쓰기',
          description: '동일한 출력 파일을 교체할지 정한다. 기본은 OFF이며, 켜면 실행 직전에 다시 확인한다. 입력 Excel을 다시 불러오면 안전을 위해 덮어쓰기 허용은 OFF로 초기화된다.',
          example: '테스트로 생성한 D:\\Central_Output\\A.rvt를 다시 만들 때만 덮어쓰기를 켜고, 운영 원본이나 연결 센트럴을 출력 경로로 쓰지 않는다.'
        }
      ]
    },
    acccloud: {
      base: {
        title: 'ACC Cloud Workshared 요청 행',
        description: '원본 RVT, 현재 Revit 지원 상태와 TEST 실행 경계를 먼저 확인하고, 각 행의 생성 대상과 요청 상태를 관리합니다.',
        points: ['Revit 지원 상태와 로그인 이름', 'RVT 추가·행 복사·행 제거', '요청/신뢰 결과 Excel', '원격 덮어쓰기 없는 TEST 실행']
      },
      extra: [
        {
          file: 'acccloud-target.png',
          title: '행별 ACC 대상과 웍셋 설정',
          description: '선택한 작업 행에 AccountGuid, ProjectGuid, FolderId/URN, Region, 모델명과 새 사용자 웍셋을 입력하는 화면입니다.',
          points: ['APPLY/SKIP Action', 'Docs URL 해석', 'US/EMEA Region', 'ACC 1차 버전 미지원 권한 옵션']
        }
      ]
    },
    accbackup: {
      base: {
        title: 'ACC 백업 TEST profile',
        description: 'LAN central, Autodesk 연결과 dry-run 상태를 확인하고 TEST Profile을 저장하는 시작 화면입니다.',
        points: ['LAN file-based central 선택', 'Autodesk 연결', '기본 dry-run과 write gate', 'queue/receipt 실행 영역']
      },
      extra: [
        {
          file: 'accbackup-target.png',
          title: 'ACC ordinary RVT 대상과 TEST 승인',
          description: 'Hub, Project, Folder, ordinary RVT Item을 순서대로 고르고 실제 외부 write 조건을 확인하는 영역입니다.',
          points: ['Hub → Project → Folder → Item', 'RCW/C4R Item 차단', '전용 테스트 folder 확인', 'Profile 저장 후 상태 새로고침']
        }
      ]
    },
    connector: {
      userGuide: '연결된 배관, 덕트, 트레이, 컨듀잇 계열 객체 사이에서 선택한 공유파라미터 값이 같은 흐름으로 이어지는지 확인하는 기능입니다. 먼저 Revit의 공유 매개변수 TXT가 연결되어 있어야 하며, 검토할 파라미터를 선택해야 실행할 수 있습니다.',
      setup: [
        '허용 범위에는 연결된 MEP 객체를 같은 연결 후보로 볼 거리 기준을 숫자로 입력합니다. 단위는 inch 또는 mm 중 실제 검토 기준에 맞게 선택합니다.',
        '검토 파라미터 선택에서 Revit 관리 > 공유 매개변수에 연결된 TXT 목록을 검색한 뒤 연속성을 확인할 파라미터를 추가합니다. 여러 개를 선택하면 같은 연결 관계에 대해 각 파라미터를 함께 검토합니다.',
        '좌표 X/Y 추출을 켜면 결과 엑셀에 요소 위치 좌표 열을 추가합니다. 선형 길이 / 방향 벡터 추출을 켜면 선형 객체의 길이와 방향 X/Y/Z 정보를 함께 저장합니다.',
        '값 매핑 설정에서는 선택 파라미터의 실제 모델 값을 스캔하고, 표기만 다른 값들을 같은 행에 묶습니다. 같은 행의 현재값과 매핑값은 양방향으로 같은 값으로 판정하며 Revit 값 자체는 수정하지 않습니다.',
        'End + Dummy 패밀리 제외를 켜면 같은 패밀리명에 End와 Dummy가 모두 포함된 요소를 검토 대상에서 제외합니다. End만 있거나 Dummy만 있는 패밀리와 타입명은 제외 조건이 아닙니다.',
        '공통 설정의 추가 파라미터, 포함 필터, 제외 필터가 있으면 같은 대상 필터 기준을 이 기능에도 적용합니다.'
      ],
      run: [
        '설정 상태 카드에서 파라미터 연속성 검토가 설정 완료로 표시되는지 확인합니다. 선택 파라미터가 없으면 실행 버튼이 활성화되지 않습니다.',
        '표기값을 통합해야 하면 값 매핑 설정 열기에서 파라미터를 고르고 활성 문서 스캔 또는 여러 RVT 스캔을 실행합니다. 스캔 값 옆에 쉼표로 구분한 동의값을 입력하고 매핑 설정 반영을 누릅니다.',
        '활성 문서 검토는 현재 Revit에서 열려 있는 호스트 문서 하나를 기준으로 바로 실행합니다. 여러 문서가 열려 있으면 실행 대상 문서를 선택한 뒤 진행합니다.',
        '여러 RVT 검토는 오른쪽 실행 영역의 여러 RVT 검토 버튼으로 RVT 등록 창을 열고, 검토할 RVT 파일을 추가한 뒤 등록된 파일 기준으로 실행합니다.',
        '결과가 생성되면 결과창에서 오류/정상 건수를 확인하고, 필요한 경우 엑셀 내보내기로 결과 파일을 저장합니다.'
      ],
      result: [
        '오류/불일치 건수와 정상 건수를 기능 결과 카드에 표시합니다.',
        '엑셀에는 연결 상대, 선택 파라미터명, 각 요소의 값, 판정 결과가 저장됩니다.',
        '좌표 또는 선형 옵션을 켠 경우 X/Y 좌표, 선형 길이, 방향 벡터 열이 추가됩니다.',
        '같은 매핑 그룹으로 판정된 값은 모델 표기가 달라도 정상으로 처리되며, 매핑은 결과 판정에만 반영됩니다.'
      ]
    },
    unconnected: {
      userGuide: 'MEP 객체의 커넥터가 실제로 연결되어 있는지 확인하고, 필요하면 중심축 연결 검토와 Tap/Saddle 묻힘 검토를 같은 결과에 함께 출력하는 기능입니다.',
      setup: [
        '기본 미연결 검토는 커넥터가 있는 객체의 연결 상태를 객체 단위로 확인합니다.',
        '중심축 연결 검토를 켜면 허용 범위와 단위를 기준으로 중심축 이탈 여부를 추가로 판정합니다. 필요 없는 프로젝트에서는 끄고 사용합니다.',
        'Tap, Saddle 모델링 검토(묻힘)를 켜면 두 Takeoff Length 기준의 묻힘 오류도 같은 엑셀에 별도 항목으로 출력합니다.',
        '공통 설정의 검토 대상 필터, 제외 필터, 추가 파라미터를 함께 사용해 결과 대상을 좁히거나 결과 열을 늘릴 수 있습니다.',
        '허용 범위 값은 중심축/묻힘 보조 검토에 사용되므로 프로젝트 기준 단위와 맞춰 입력합니다.'
      ],
      run: [
        '설정 상태가 완료되면 활성 문서 검토 또는 여러 RVT 검토를 선택합니다.',
        '여러 RVT 검토에서는 RVT 등록 창에서 체크된 파일만 검토 대상으로 넘어갑니다.',
        '검토가 끝나면 결과창에서 전체 미연결, 일부 미연결, 보조 검토 오류 건수를 확인합니다.',
        '엑셀 내보내기를 누르면 선택한 언어와 저장 방식에 따라 결과를 저장합니다.'
      ],
      result: [
        '미연결 오류와 정상 검토 건수를 표시합니다.',
        '엑셀에는 요소 정보, 커넥터 상태, 중심축/묻힘 보조 검토 결과, 추가 파라미터 값이 저장됩니다.',
        '보조 검토를 꺼둔 항목은 결과 열이나 집계에 포함되지 않습니다.'
      ]
    },
    floorinfo: {
      userGuide: '활성 문서의 레벨 구간을 기준으로 객체가 가져야 할 층/영역 파라미터 값을 비교하는 보조 검토 기능입니다. 먼저 기준 레벨과 각 구간의 기대값을 정해야 합니다.',
      setup: [
        '설정 창에서 활성 문서의 레벨 목록을 불러온 뒤 층정보 영역을 나눌 기준 레벨을 선택합니다.',
        '선택한 레벨 구간별로 기대 층정보 값을 입력합니다. 선택하지 않은 중간 레벨은 구간 기준으로만 사용되지 않습니다.',
        '비교할 파라미터명은 프로젝트에서 실제 층/영역 정보를 저장하는 파라미터 이름으로 입력합니다.',
        '공통 설정의 포함 필터와 제외 필터를 사용하면 특정 카테고리, 패밀리, 타입만 검토하거나 제외할 수 있습니다.',
        '추가 파라미터를 입력하면 검토 판정 외에 결과 엑셀 보조 열로 함께 저장됩니다.'
      ],
      run: [
        '영역 기준 레벨과 기대값이 설정되어야 검토 버튼이 활성화됩니다.',
        '활성 문서 검토는 현재 열린 문서의 레벨 기준을 사용합니다.',
        '여러 RVT 검토는 같은 설정값을 등록된 RVT 파일에 순서대로 적용합니다.',
        '실행 전 각 RVT가 같은 레벨/파라미터 체계를 쓰는지 확인하는 것이 좋습니다.'
      ],
      result: [
        '영역 기준 불일치 건수와 정상 건수를 표시합니다.',
        '엑셀에는 대상 요소, 판정된 레벨 구간, 기대값, 실제 파라미터 값, 판정 결과가 저장됩니다.',
        '영역을 판정할 수 없는 요소는 별도 상태로 확인할 수 있습니다.'
      ]
    },
    familysuitability: {
      userGuide: '모델에 실제 사용된 카테고리/패밀리/타입 조합이 승인 기준 엑셀에 있는지 확인하는 기능입니다. 기준 엑셀과 결과에 사용할 판정 문구를 먼저 준비해야 합니다.',
      setup: [
        '기준 엑셀 파일을 선택합니다. 엑셀에는 카테고리, 패밀리, 타입을 식별할 수 있는 헤더가 있어야 합니다.',
        '기준 엑셀을 선택하면 카테고리/패밀리/타입 헤더를 찾아 승인 조합을 불러옵니다.',
        '기준 일치 문구와 기준 미일치 문구를 입력합니다. 이 문구가 결과 엑셀의 판정 또는 비고 문구로 사용됩니다.',
        '이름 포함 필터나 예외 규칙을 사용하면 특정 패밀리/타입을 우선 판정하거나 검토에서 제외할 수 있습니다.'
      ],
      run: [
        '기준 엑셀과 판정 문구가 준비되면 설정 상태가 완료로 바뀝니다.',
        '활성 문서 검토 또는 여러 RVT 검토를 실행합니다. 여러 RVT 검토에서는 같은 기준 엑셀을 모든 파일에 적용합니다.',
        '결과는 실제 사용된 타입 기준으로 집계되므로 프로젝트에 로드되어 있지만 사용되지 않은 타입은 검토 결과에 나오지 않을 수 있습니다.',
        '검토 후 결과창에서 부적합 타입 수와 정상 타입 수를 확인하고 엑셀로 저장합니다.'
      ],
      result: [
        '승인 기준과 일치하지 않는 패밀리/타입 건수와 정상 건수를 표시합니다.',
        '엑셀에는 파일, 카테고리, 패밀리, 타입, 기준 일치 여부, 사용자가 입력한 판정 문구가 저장됩니다.',
        '필터 우선 규칙에 걸린 항목은 해당 규칙의 문구가 우선 표시됩니다.'
      ]
    },
    tapalign: {
      userGuide: '탭 또는 분기 피팅의 축이 연결 라인의 중심축에서 벗어났는지 확인하는 기능입니다. 허용 범위, 검토 공종, 대상 필터를 설정합니다.',
      setup: [
        '허용 범위에는 중심축에서 벗어난 거리의 허용값을 숫자로 입력합니다.',
        '단위는 mm 또는 inch 중 결과 판정에 사용할 기준으로 선택합니다.',
        '검토 범위에서 배관과 덕트 중 실제 Tap/Branch 검토가 필요한 공종을 선택합니다.',
        '기능 전용 필터를 추가하면 특정 파라미터 조건에 맞는 요소만 검사할 수 있습니다.',
        '공통 필터와 제외 필터를 사용하면 특정 카테고리, 패밀리, 타입만 검토하거나 제외할 수 있습니다.'
      ],
      run: [
        '허용 범위와 단위가 입력된 상태에서 활성 문서 검토 또는 여러 RVT 검토를 실행합니다.',
        '여러 RVT 검토는 RVT 등록 창에서 체크된 파일만 순서대로 검토합니다.',
        '결과창에서 축 틀어짐 오류 건수와 정상 건수를 확인합니다.',
        '공통 설정에 추가 파라미터를 지정했다면 결과 엑셀에서 해당 값도 함께 확인합니다.'
      ],
      result: [
        '허용 범위를 초과한 탭/분기 피팅을 오류로 표시합니다.',
        '엑셀에는 대상 요소, 기준 축, 편차값, 허용값, 판정 결과가 저장됩니다.',
        '공통 설정의 추가 파라미터를 선택한 경우 해당 값이 보조 열로 저장됩니다.'
      ]
    },
    tapdepth: {
      userGuide: 'Tap/Saddle 객체의 삽입 깊이가 Takeoff Length 기준과 맞는지 확인하는 기능입니다. 허용 범위, 검토 공종, 대상 필터를 설정합니다.',
      setup: [
        '허용 범위에는 Takeoff Length 기준과 실제 묻힘 깊이 사이에서 허용할 차이를 입력합니다.',
        '단위는 프로젝트 검토 기준에 맞춰 mm 또는 inch로 선택합니다.',
        '검토 범위에서 배관과 덕트 중 실제 Tap/Saddle 검토가 필요한 공종을 선택합니다.',
        '기능 전용 필터를 추가하면 특정 파라미터 조건에 맞는 요소만 검사할 수 있습니다.',
        '공통 필터와 제외 필터를 사용해 특정 패밀리나 타입을 포함/제외할 수 있습니다.'
      ],
      run: [
        '허용 범위와 단위가 준비되면 활성 문서 검토 또는 여러 RVT 검토를 실행합니다.',
        '여러 RVT 검토에서는 등록된 파일별로 묻힘 오류를 집계합니다.',
        'BQC 선택 실행에서는 다른 기능과 함께 같은 실행 세트로 돌릴 수 있습니다.',
        '결과 확인 후 엑셀 내보내기로 파일별 또는 통합 결과를 저장합니다.'
      ],
      result: [
        'Tap/Saddle 묻힘 오류 건수와 정상 건수를 표시합니다.',
        '엑셀에는 기준 Takeoff Length, 실제 묻힘 깊이, 차이값, 허용값, 판정 결과가 저장됩니다.',
        '공통 설정의 추가 파라미터를 선택한 경우 해당 값이 보조 열로 저장됩니다.'
      ]
    },
    dupclash: {
      userGuide: 'BQC 실행 세트에서 여러 RVT의 중복 객체 또는 자체 간섭 객체를 배치 검토하는 기능입니다. 검토 모드와 BQC 공통 필터를 사용합니다.',
      setup: [
        '검토 모드에서 중복 검토 또는 자체 간섭 검토를 선택합니다.',
        '중복 검토는 같은 위치와 형상을 가진 요소를 그룹으로 묶고, 자체 간섭 검토는 서로 겹치는 요소 쌍을 찾습니다.',
        '포함/제외 필터를 설정하면 특정 카테고리나 패밀리만 비교하거나 제외할 수 있습니다.',
        '공통 설정의 추가 파라미터를 지정하면 오류 후보의 해당 값을 결과에 함께 저장합니다.',
        '허용 오차, 비교쌍, 제외 세트 같은 상세 규칙은 별도 화면의 중복 / 자체 간섭 검토에서 설정합니다.'
      ],
      run: [
        '검토 모드와 공통 필터를 설정한 뒤 활성 문서 검토 또는 여러 RVT 검토를 실행합니다.',
        '여러 RVT 검토에서는 파일별로 중복 또는 간섭 결과를 분리해 집계합니다.',
        '검토량이 큰 모델은 공통 포함/제외 필터로 대상을 먼저 좁히면 결과 확인이 쉬워집니다.',
        '결과창에서 그룹별 오류를 확인하고 엑셀로 저장합니다.'
      ],
      result: [
        '중복 검토는 중복 후보 그룹 수를, 자체 간섭 검토는 충돌 후보 건수를 표시합니다.',
        '엑셀에는 그룹, 대상 요소, 카테고리, 패밀리/타입, 위치, 판정 결과가 저장됩니다.',
        '공통 설정에서 선택한 추가 파라미터는 보조 열로 함께 출력됩니다.'
      ]
    },
    worksetassignment: {
      userGuide: '객체가 지정한 정상 웍셋에 들어가 있는지 확인하는 기능입니다. 허용할 웍셋 이름을 기준으로 목록 밖 객체를 오류로 표시합니다.',
      setup: [
        '정상 웍셋 이름에는 허용할 웍셋명을 정확히 입력합니다. 입력한 이름과 다른 웍셋에 있는 객체는 오류로 판정됩니다.',
        '공통 설정의 포함 필터를 사용해 특정 카테고리나 패밀리만 웍셋 검토 대상으로 지정합니다.',
        '제외 필터를 사용하면 검토하지 않을 카테고리, 패밀리, 타입을 제외할 수 있습니다.',
        '추가 파라미터를 입력하면 결과 엑셀에서 웍셋 오류와 함께 해당 값을 확인할 수 있습니다.'
      ],
      run: [
        '정상 웍셋 이름을 확인한 뒤 활성 문서 검토 또는 여러 RVT 검토를 실행합니다.',
        '여러 RVT 검토는 등록된 파일별로 웍셋 오류를 집계합니다.',
        '정상 웍셋 기준이 프로젝트마다 다르면 한 번에 묶지 말고 기준이 같은 파일끼리 실행합니다.',
        '검토 후 결과창에서 웍셋 오류 건수와 정상 건수를 확인합니다.'
      ],
      result: [
        '정상 웍셋 목록 밖에 있는 객체 수와 정상 객체 수를 표시합니다.',
        '엑셀에는 현재 웍셋, 기대 웍셋 기준, 요소 정보, 추가 파라미터 값이 저장됩니다.',
        '검토 필터에 제외된 요소는 결과에 포함되지 않습니다.'
      ]
    },
    parameterduplication: {
      userGuide: '프로젝트 파라미터 중 같은 이름으로 중복 등록된 항목을 찾는 기능입니다. 전체 프로젝트 파라미터를 검사하거나, 공유파라미터 목록에서 특정 이름만 골라 검사할 수 있습니다.',
      setup: [
        '검토 범위에서 전체 프로젝트 파라미터를 볼지, 선택한 공유파라미터만 볼지 결정합니다.',
        '특정 파라미터만 검토하려면 Revit에 연결된 공유 매개변수 TXT 목록에서 이름을 검색해 선택합니다.',
        '중복 검토는 이름, GUID, 바인딩 범위를 함께 보므로 같은 이름이어도 바인딩 대상이 겹치는지 확인합니다.',
        '공유파라미터 목록이 비어 있으면 Revit 관리 > 공유 매개변수에서 TXT 연결 상태를 먼저 확인합니다.'
      ],
      run: [
        '검토 범위가 정해지면 활성 문서 검토 또는 여러 RVT 검토를 실행합니다.',
        '선택 파라미터가 없고 전체 검토 모드라면 문서에 등록된 전체 프로젝트 파라미터를 대상으로 합니다.',
        '여러 RVT 검토에서는 파일별로 중복 파라미터를 집계합니다.',
        '검토 후 결과창에서 중복 건수와 정상 건수를 확인하고 엑셀을 저장합니다.'
      ],
      result: [
        '중복 파라미터 오류 건수와 정상 건수를 표시합니다.',
        '엑셀에는 파라미터명, GUID, 바인딩 타입, 바인딩 카테고리, 중복 판정이 저장됩니다.',
        '선택 검토를 사용한 경우 선택한 이름만 결과에 포함됩니다.'
      ]
    },
    parametermissing: {
      userGuide: '지정한 공유파라미터 값이 비어 있는 객체를 찾는 기능입니다. 검토할 파라미터와 객체 필터, 누락 예외 규칙을 설정해야 합니다.',
      setup: [
        'Revit에 연결된 공유 매개변수 TXT 목록에서 누락 여부를 확인할 파라미터를 선택합니다.',
        '객체 필터에는 검토할 대상 조건을 지정합니다. 공통 포함 필터와 함께 적용됩니다.',
        '누락 예외 규칙에는 값이 비어 있어도 오류로 보지 않을 조건을 입력합니다.',
        '공통 제외 필터를 사용하면 검토하지 않을 객체를 먼저 제외할 수 있습니다.',
        '추가 파라미터를 지정하면 누락 결과 엑셀에 참고 값으로 함께 출력됩니다.'
      ],
      run: [
        '선택 파라미터가 1개 이상 있어야 설정 완료로 처리됩니다.',
        '활성 문서 검토 또는 여러 RVT 검토를 실행합니다.',
        '여러 RVT 검토는 같은 파라미터/필터/예외 규칙을 모든 등록 파일에 적용합니다.',
        '검토 후 결과창에서 누락 건수와 정상 건수를 확인합니다.'
      ],
      result: [
        '비어 있는 파라미터 값은 누락 오류로 표시합니다.',
        '엑셀에는 파라미터명, 현재값, 카테고리, 패밀리/타입, 예외 적용 여부가 저장됩니다.',
        '예외 규칙에 걸린 항목은 누락 오류에서 제외됩니다.'
      ]
    },
    parameterstandard: {
      userGuide: '기준 엑셀에 정의된 허용값과 모델 객체의 파라미터 값을 비교하는 기능입니다. 기준 엑셀의 시트, 기준 파라미터, 허용값을 먼저 읽어야 합니다.',
      setup: [
        '기준 엑셀 파일을 선택합니다. 엑셀에는 비교할 파라미터와 허용값을 식별할 수 있는 구조가 필요합니다.',
        '엑셀을 불러오면 시트 수, 기준 파라미터 수, 허용값 수, 공란 허용 항목을 확인합니다.',
        '공란 허용이 필요한 파라미터는 기준 엑셀에서 허용 규칙으로 관리합니다.',
        '공통 포함/제외 필터를 사용해 비교할 객체 범위를 제한합니다.',
        '추가 파라미터를 입력하면 기준 불일치 결과와 함께 참고 값으로 저장됩니다.'
      ],
      run: [
        '기준 엑셀이 등록되고 기준 파라미터가 확인되어야 실행할 수 있습니다.',
        '활성 문서 검토 또는 여러 RVT 검토를 실행합니다.',
        '여러 RVT 검토는 동일 기준 엑셀을 모든 등록 파일에 적용합니다.',
        '결과창에서 기준 불일치 건수와 정상 건수를 확인하고 엑셀을 저장합니다.'
      ],
      result: [
        '기준값과 실제값이 다른 항목을 오류로 표시합니다.',
        '엑셀에는 기준 파라미터, 허용값, 실제값, 공란 허용 여부, 판정 결과가 저장됩니다.',
        '기준 엑셀에서 읽지 못한 규칙이 있으면 설정 상태 또는 결과 메시지에서 확인합니다.'
      ]
    },
    deliverycleaner: {
      userGuide: '납품용 RVT를 정리하고, 정리 결과를 검토/추출/저장하는 별도 화면 기능입니다. 먼저 대상 RVT를 등록하고 기본/세부 설정에서 정리 규칙을 정합니다.',
      setup: [
        '대상 RVT 영역에서 정리할 납품 파일을 추가합니다. 드래그 앤 드롭 또는 RVT 추가 버튼으로 등록할 수 있습니다.',
        '기본/세부 설정에서 정리 결과 폴더와 정리용 3D 뷰 이름을 입력합니다.',
        '뷰 파라미터, 객체 파라미터, 뷰 필터, V/G 설정 탭에서 정리하거나 유지할 기준을 설정합니다.',
        'Imported Categories 관련 옵션은 Revit V/G의 Imported Categories 표시/Imports in Families 표시를 제어하는 용도입니다.',
        '설정이 끝나면 대상 RVT 목록과 설정 상태가 모두 준비되었는지 확인합니다.'
      ],
      run: [
        '정리 시작을 누르면 등록된 RVT를 기준으로 납품 정리를 실행합니다.',
        '정리 결과 검토는 정리 후 생성된 결과를 다시 확인하는 단계입니다.',
        '속성값 추출은 정리된 파일에서 필요한 속성 데이터를 결과로 뽑을 때 사용합니다.',
        '불필요 항목 제거는 정리 결과 또는 선택한 RVT 기준으로 Purge 성격의 후처리를 수행합니다.',
        '결과 폴더 열기와 로그 엑셀 저장으로 산출물과 처리 로그를 확인합니다.'
      ],
      result: [
        '준비/실행/결과 처리/열기 저장 단계별 상태가 오른쪽 실행 및 결과 영역에 표시됩니다.',
        '로그 엑셀에는 파일별 처리 상태, 오류, 정리 결과가 저장됩니다.',
        '정리 결과 파일은 설정한 결과 폴더 기준으로 확인합니다.'
      ]
    },
    conditionextract: {
      userGuide: '조건식으로 객체를 걸러낸 뒤 지정한 파라미터, 좌표, 선형 정보를 추출하는 별도 화면 기능입니다. 필터 조건과 추출 항목을 한 화면에서 조합합니다.',
      setup: [
        '조건 결합에서 And 또는 Or를 선택합니다. And는 모든 조건을 만족해야 하고, Or는 조건 중 하나만 만족해도 추출 대상이 됩니다.',
        '필터에는 파라미터 이름, 연산자, 값을 입력합니다. 필요한 만큼 필터 행을 추가해 대상 객체를 좁힙니다.',
        '추출 파라미터에는 결과 엑셀로 뽑을 파라미터 이름을 입력합니다. 여러 항목을 사용할 때는 각 입력칸 또는 쉼표 구분 규칙을 따릅니다.',
        '좌표 추출을 켜면 X/Y/Z 좌표 열을 저장합니다. 선형 길이/방향 벡터 추출을 켜면 Length와 Direction X/Y/Z 열을 함께 저장합니다.',
        '단위 설정에서 좌표/길이, 면적, 체적 출력 단위를 정합니다. 길이/면적/체적 파라미터는 선택 단위로 변환됩니다.'
      ],
      run: [
        '추출 파라미터 또는 좌표/선형 옵션 중 하나 이상이 설정되어야 검토 버튼이 활성화됩니다.',
        '활성 문서 검토는 현재 호스트 문서를 기준으로 실행합니다.',
        '활성 문서 + 링크 검토는 현재 문서에 연결된 Revit 링크 문서를 함께 읽어 추출합니다.',
        '여러 RVT 검토는 RVT 등록 창에 추가된 파일들을 같은 조건으로 순서대로 처리합니다.',
        '실행 후 결과를 확인하고 필요한 경우 엑셀로 저장합니다.'
      ],
      result: [
        '조건을 통과한 객체 수와 추출 행 수가 표시됩니다.',
        '엑셀에는 파일, 요소 정보, 필터 기준, 추출 파라미터 값, 좌표/선형 옵션 값이 저장됩니다.',
        '조건에 맞는 객체가 없으면 빈 결과 또는 결과 없음 메시지로 표시됩니다.'
      ]
    },
    dup: {
      userGuide: '활성 문서에서 중복 객체 또는 자체 간섭을 단독으로 확인하는 별도 화면 기능입니다. 규칙 칩과 설정 버튼으로 검사 조건을 바꾸고 바로 검토합니다.',
      setup: [
        '검토 모드에서 중복 검토와 자체 간섭 중 사용할 모드를 선택합니다.',
        '기본 및 세부 설정에서 허용 오차, 검사 범위, 비교쌍, 제외 세트, 제외 목록, 키워드를 조정합니다.',
        '속성 추출 항목을 설정하면 오류 후보의 보조 파라미터 값을 함께 출력합니다.',
        '범위 전체 또는 특정 범위 선택에 따라 비교 대상 수와 결과 크기가 달라집니다.',
        '검토량이 많으면 제외 목록과 키워드를 먼저 정리해 결과를 줄이는 것이 좋습니다.'
      ],
      run: [
        '설정 및 실행 영역에서 검토 시작을 누르면 현재 활성 문서 기준으로 실행합니다.',
        '검토 결과가 생성되면 중앙 결과 영역에 그룹 또는 후보 목록이 표시됩니다.',
        '엑셀 내보내기는 결과가 있을 때 활성화됩니다.',
        '필요하면 모드와 제외 조건을 조정한 뒤 다시 검토합니다.'
      ],
      result: [
        '중복 그룹 또는 자체 간섭 후보가 결과 영역에 표시됩니다.',
        '엑셀에는 대상 요소, 그룹, 위치, 카테고리, 패밀리/타입, 판정 결과가 저장됩니다.',
        '속성 추출을 설정한 경우 해당 파라미터 값이 결과 열로 추가됩니다.'
      ]
    },
    paramprop: {
      userGuide: '현재 활성 문서의 복합 패밀리를 검사해 선택한 공유파라미터를 하위 패밀리에 추가하고 상위-하위 연동을 구성하는 기능입니다.',
      setup: [
        'Revit에 연결된 공유 매개변수 TXT 목록에서 추가하거나 연동할 파라미터를 선택합니다.',
        'Dummy 하위 패밀리 제외와 단일 패밀리 처리 여부를 선택해 작업 범위를 정합니다.',
        '파라미터를 인스턴스 또는 타입으로 추가할지와 Revit의 Parameter Group을 선택합니다.',
        '수정된 하위 패밀리 RFA를 남기려면 파일 저장을 켜고 저장 폴더를 지정합니다.',
        '현재 열린 문서가 편집 가능한 복합 패밀리인지 확인합니다.'
      ],
      run: [
        '추가할 공유파라미터를 1개 이상 선택하면 연동 실행 버튼이 활성화됩니다.',
        '연동 실행은 현재 활성 복합 패밀리의 하위 패밀리를 열어 파라미터를 추가하고 상위 파라미터와 연결합니다.',
        '단일 패밀리까지 추가를 켜면 중첩되지 않은 패밀리도 파라미터 추가 대상으로 처리합니다.',
        'RFA 저장을 켠 경우 지정한 폴더에 수정된 패밀리 파일을 함께 저장합니다.'
      ],
      result: [
        '파라미터 추가 성공, 이미 존재, 연동 성공, 건너뜀, 실패 건수를 구분해 표시합니다.',
        '엑셀 또는 로그에는 상위 패밀리, 하위 패밀리, 파라미터명, 추가/연동 처리 상태가 저장됩니다.',
        'RFA 저장을 켠 경우 저장 성공 여부와 파일 경로를 함께 확인할 수 있습니다.'
      ]
    },
    segmentpms: {
      userGuide: 'RVT에서 Segment 정보를 추출한 뒤 PMS 양식과 매핑해 비교 검토하는 2단계 기능입니다. 추출 단계와 검토 단계를 분리해서 진행합니다.',
      setup: [
        '1단계 추출 영역에서 RVT 파일을 추가하거나 폴더 선택, 드래그 앤 드롭으로 대상 파일을 등록합니다.',
        '추출 시작을 누르면 RVT에서 Segment 데이터를 엑셀로 뽑습니다. 이미 추출한 파일이 있으면 추출 결과 불러오기로 가져올 수 있습니다.',
        '2단계 검토 영역에서 PMS 양식 추출하기로 샘플 양식을 내려받고 같은 형식으로 PMS 데이터를 작성합니다.',
        '추출 결과와 PMS 파일을 불러오면 Revit 세그먼트 그룹, 사용자, PMS 세그먼트 매핑을 선택합니다.',
        '매핑 준비 상태가 완료되어야 검토 시작을 실행할 수 있습니다.'
      ],
      run: [
        '먼저 RVT 추출을 실행하거나 기존 추출 결과를 불러옵니다.',
        'PMS 양식을 준비한 뒤 PMS 등록/업데이트 또는 불러오기 흐름으로 데이터를 연결합니다.',
        '그룹 매핑을 확인한 뒤 검토 시작을 누릅니다.',
        '검토 완료 후 엑셀 내보내기로 비교 결과를 저장합니다.'
      ],
      result: [
        '정상, 검토 필요, 오류 건수와 전체 검토 결과 건수가 표시됩니다.',
        '엑셀에는 Revit Segment, PMS Segment, 사용자 매핑, 추천/판정 상태가 저장됩니다.',
        '분류가 애매한 항목은 검토 필요로 집계됩니다.'
      ]
    },
    parammodifier: {
      userGuide: '조건을 만족하는 객체의 파라미터 값을 일괄 수정하는 기능입니다. 조건, 입력 파라미터, 적용 대상, 동기화 옵션을 확인한 뒤 실행합니다.',
      setup: [
        '조건 영역에서 대상 객체를 찾을 파라미터명, 연산자, 값을 입력합니다.',
        '입력 파라미터 영역에서 수정할 파라미터명과 새 값을 입력합니다.',
        '여러 행을 입력하면 조건 대상에 여러 파라미터 값을 한 번에 적용할 수 있습니다.',
        '동기화 옵션에서 활성 문서 작업 후 동기화 여부와 코멘트를 설정합니다.',
        '조건이 너무 넓으면 의도하지 않은 객체까지 변경될 수 있으므로 실행 전 조건을 좁혀 확인합니다.'
      ],
      run: [
        '입력 파라미터가 준비되면 활성 문서 적용 또는 여러 RVT 적용을 선택합니다.',
        '활성 문서 적용은 현재 문서에 즉시 값을 입력합니다.',
        '여러 RVT 적용은 등록한 RVT를 순서대로 열어 같은 조건을 적용합니다.',
        '실행 후 변경 로그를 확인하고 필요하면 엑셀로 저장합니다.'
      ],
      result: [
        '변경 대상 수, 성공 수, 실패 수를 표시합니다.',
        '로그에는 파일, 요소, 수정 파라미터, 기존값, 입력값, 처리 상태가 저장됩니다.',
        '쓰기 불가능한 파라미터나 조건 미일치 항목은 실패 또는 변경 없음으로 기록됩니다.'
      ]
    },
    linkpath: {
      userGuide: 'Revit 링크 경로 추출/재지정은 여러 호스트 RVT의 링크 현황을 먼저 Excel v2로 만들고, Action 열에서 지정한 행만 다시 적용하는 기능입니다. 추출된 기존 링크는 기본적으로 유지이며, 대상 경로가 비어 있다는 이유만으로 삭제되지 않습니다.',
      setup: [
        '1단계에서 RVT 파일을 추가하거나 드래그 앤 드롭으로 등록합니다.',
        '링크 추출을 실행하면 호스트 파일별 Revit 링크 이름, 현재 경로, 링크 방식, Loaded/Unloaded/NotFound 등의 링크 상태와 웍셋 정보를 수집합니다.',
        'Excel 내보내기로 추출 결과를 저장한 뒤 노란색 Action, ApplyTypeWorksetNames, ApplyInstanceWorksetNames, TargetLinkPath, TargetPathType 열만 수정합니다.',
        '2단계에서 수정한 Excel을 선택하고 신규 링크가 있는 경우에만 신규 링크 배치 방식을 확인합니다.',
        'Excel 기준 적용은 HostFilePath와 추출된 ReferenceElementId를 기준으로 기존 링크를 식별하고, Action이 있는 최신 양식에서는 복사 행의 ID/LinkName을 지우지 않아도 신규 링크로 처리합니다.'
      ],
      run: [
        'RVT 등록 후 링크 추출을 먼저 실행합니다.',
        '추출 결과 엑셀을 저장하고 새 링크 경로를 입력합니다.',
        '엑셀 선택으로 수정 엑셀을 불러온 뒤 엑셀 기준 적용을 누릅니다.',
        '적용 전에는 링크 상태와 삭제 후보를, 적용 후에는 변경·삭제·오류 상태를 확인합니다.'
      ],
      result: [
        '호스트 수, 링크 수, 실행 대상 수, 적용 확인 수, 실패 수가 표시됩니다.',
        '결과 표는 결과, 대상(호스트·링크), 작업, 원인·조치 네 열로 단순화되어 실행 행과 오류·주의 행만 보여 줍니다.',
        '엑셀 기준이 비어 있거나 호스트/대상 파일을 찾지 못하면 원인과 다음 조치가 표시되며, 기술 상세에서 Revit 원문을 펼쳐 볼 수 있습니다.'
      ]
    },
    lateralnozzle: {
      userGuide: '노즐코드 KTA 양식을 정리하고 UT명, 배관No, Nozzle Code, No 정보를 기준으로 형식 누락이나 불일치를 찾는 엑셀 전용 기능입니다.',
      setup: [
        '엑셀 추가로 검사할 xlsx 또는 xls 파일을 등록합니다. 여러 파일을 한 번에 추가할 수 있습니다.',
        '각 파일의 모든 시트를 검사해 UT명, 배관No, Nozzle Code, No 헤더 블록을 찾습니다.',
        '검사 규칙은 UT명/LATERAL NO/Nozzle Code 중 하나라도 비어 있으면 누락으로 표시합니다.',
        'Nozzle Code는 No 값을 포함해야 하며, _000 형태의 숫자 3자리로 끝나는지 확인합니다.',
        '잘못된 형식 경고가 뜨지 않도록 올바른 엑셀 파일만 등록합니다.'
      ],
      run: [
        '엑셀 파일을 등록한 뒤 추출 시작을 누릅니다.',
        '목록에서 선택한 파일만 제거하거나 목록 지우기로 전체 등록을 초기화할 수 있습니다.',
        '처리가 끝나면 최근 결과 카드에서 처리 파일 수와 비교 건수를 확인합니다.',
        '결과 파일은 저장 옵션에 따라 원본 정리본 또는 검토 결과로 저장됩니다.'
      ],
      result: [
        '처리 파일 수, 추출 건수, 비교 건수가 표시됩니다.',
        '엑셀에는 정리된 KTA 결과와 누락/형식 불일치 항목이 저장됩니다.',
        'Nozzle Code와 No 값 연결이 맞지 않으면 비교 형식 불일치로 표시됩니다.'
      ]
    },
    guid: {
      userGuide: 'RVT의 프로젝트/패밀리 파라미터 GUID를 검토하고, 삭제용 엑셀을 거쳐 정리까지 진행하는 기능입니다.',
      setup: [
        'RVT 파일을 추가합니다. 목록이 비어 있으면 현재 활성 문서를 기준으로 검토할 수 있습니다.',
        '설정에서 패밀리 포함 여부와 주석 패밀리 포함 여부를 선택합니다.',
        '삭제 정리 시 동기화 코멘트를 남길지와 사용할 문구를 설정합니다.',
        '삭제 정리를 하려면 먼저 GUID 검토 결과를 만들고 삭제용 엑셀을 내보냅니다.',
        '삭제용 엑셀의 삭제여부 열에 삭제할 행을 표시한 뒤 다시 불러옵니다.'
      ],
      run: [
        '검토 시작으로 프로젝트/패밀리 파라미터 GUID 결과를 생성합니다.',
        '삭제용 엑셀 내보내기로 작업 목록을 저장합니다.',
        '엑셀에서 삭제여부를 입력한 뒤 삭제용 엑셀 불러오기를 실행합니다.',
        '정리 시작을 누르면 삭제 표시된 항목만 정리 대상으로 적용합니다.'
      ],
      result: [
        'RVT 검토 결과와 Family 검토 결과가 분리되어 표시됩니다.',
        '엑셀에는 파라미터명, GUID, 바인딩, 삭제여부, 정리 상태가 저장됩니다.',
        '삭제 대상이 아닌 행은 정리에서 제외됩니다.'
      ]
    },
    tapdepthutility: {
      userGuide: 'BQC 그룹과 별도로 Tap/Saddle 묻힘 깊이를 단독 또는 유틸리티 실행 세트에서 검토하는 기능입니다.',
      setup: [
        '묻힘 허용값과 단위를 입력합니다. 값은 Takeoff Length 기준과 실제 묻힘 깊이의 차이 판정에 사용됩니다.',
        '검토 범위에서 배관과 덕트 중 실제 Tap/Saddle 검토가 필요한 공종을 선택합니다.',
        '기능 전용 필터를 추가하면 특정 파라미터 조건에 맞는 요소만 검사할 수 있습니다.',
        '공통 필터와 제외 조건을 사용해 검토할 Tap/Saddle 대상만 남깁니다.',
        'BQC의 Tap, Saddle 묻힘 검토와 같은 판정 로직을 사용하므로 같은 기준으로 맞춰 입력합니다.'
      ],
      run: [
        '설정 완료 후 활성 문서 검토 또는 여러 RVT 검토를 실행합니다.',
        '여러 RVT 검토는 등록된 파일별로 묻힘 오류를 집계합니다.',
        '단독 유틸리티 용도로 사용할 때는 유틸리티 그룹에서 이 기능만 선택해 실행합니다.',
        '결과 확인 후 엑셀 내보내기로 저장합니다.'
      ],
      result: [
        '묻힘 오류 건수와 정상 건수를 표시합니다.',
        '엑셀에는 기준 길이, 실제 깊이, 차이, 허용값, 판정 결과가 저장됩니다.',
        '공통 설정의 추가 파라미터를 선택한 경우 해당 값이 보조 열로 저장됩니다.'
      ]
    },
    familylink: {
      userGuide: '복합 패밀리와 하위 패밀리 사이에 지정한 공유파라미터가 존재하고 연동되어 있는지 확인하는 기능입니다.',
      setup: [
        'Revit 관리 > 공유 매개변수에 연결된 TXT 목록에서 검토할 공유파라미터를 선택합니다.',
        '단일 패밀리까지 파라미터 추가 여부를 검토할지 선택합니다.',
        '선택한 파라미터만 하위 패밀리 추가 또는 연동 검토 대상으로 사용됩니다.',
        '공유파라미터 목록이 비어 있으면 Revit의 공유 매개변수 TXT 연결 상태를 먼저 확인합니다.',
        '필요하면 여러 파라미터를 선택해 같은 패밀리 구조에 대해 한 번에 검토합니다.'
      ],
      run: [
        '선택 파라미터가 1개 이상 있어야 설정 완료로 처리됩니다.',
        '활성 문서 검토 또는 여러 RVT 검토를 실행합니다.',
        '여러 RVT 검토에서는 등록된 RVT 파일별로 패밀리 구조와 연동 상태를 확인합니다.',
        '검토 후 연동 누락, 파라미터 없음, 정상 건수를 확인합니다.'
      ],
      result: [
        '연동 누락, 파라미터 없음, 정상 건수를 표시합니다.',
        '엑셀에는 파일, 상위 패밀리, 하위 패밀리, 파라미터명, 연동 상태가 저장됩니다.',
        '선택하지 않은 공유파라미터는 결과에 포함되지 않습니다.'
      ]
    },
    points: {
      userGuide: 'RVT의 프로젝트 기준점, 측량 기준점, 내부 원점 공유좌표, 프로젝트 북각 정보를 선택한 출력 단위로 파일별 추출하는 기능입니다.',
      setup: [
        '단위에서 좌표를 십진 피트, 미터(m), 밀리미터(mm) 중 어떤 값으로 출력할지 선택합니다.',
        '활성 문서를 검토하려면 현재 열린 호스트 문서를 준비합니다.',
        '여러 파일을 비교하려면 여러 RVT 검토에서 파일을 등록합니다.',
        '결과 비교가 필요하면 같은 좌표 기준을 사용하는 RVT끼리 묶어 실행하는 것이 좋습니다.'
      ],
      run: [
        '출력 단위를 선택한 뒤 활성 문서 검토 또는 여러 RVT 검토를 선택합니다.',
        '여러 RVT 검토에서는 등록된 파일별로 프로젝트 기준점, 측량 기준점, 내부 원점 공유좌표, 북각 값을 추출합니다.',
        '추출 완료 후 결과를 표로 확인합니다.',
        '엑셀 내보내기로 좌표 정보를 저장합니다.'
      ],
      result: [
        '파일별 프로젝트 기준점, 측량 기준점, 내부 원점 공유좌표, 북각 값이 표시됩니다.',
        '엑셀에는 파일명, 선택한 단위의 프로젝트 기준점 좌표, 측량 기준점 좌표, 내부 원점 공유좌표, 프로젝트 북각 값이 저장됩니다.',
        '읽을 수 없는 값은 빈 값 또는 오류 상태로 기록됩니다.'
      ]
    },
    linkworkset: {
      userGuide: '호스트 RVT의 Revit 링크 로드 상태와 열린 웍셋을 점검하고, 필요한 경우 기본 웍셋만 열리도록 적용하는 기능입니다.',
      setup: [
        '점검 모드와 적용 모드 중 목적에 맞는 실행 흐름을 선택합니다.',
        '점검만 할 때는 현재 링크 상태를 읽어 결과로 정리합니다.',
        '적용을 실행할 때는 기본 웍셋 기준으로 링크를 다시 열도록 처리합니다.',
        '여러 RVT 검토를 사용할 경우 같은 링크 운영 기준을 적용할 파일만 묶습니다.',
        '적용 전에는 링크 경로와 로드 상태가 정상인지 확인합니다.'
      ],
      run: [
        '활성 문서 검토 또는 여러 RVT 검토를 실행합니다.',
        '점검 실행은 링크별 현재 로드 상태와 열린 웍셋을 결과로 남깁니다.',
        '적용 실행은 기본 웍셋 기준으로 링크 열림 상태를 갱신합니다.',
        '실행 후 변경 수와 오류 수를 확인하고 엑셀로 저장합니다.'
      ],
      result: [
        '링크 수, 변경 수, 오류 수를 표시합니다.',
        '엑셀에는 호스트 파일, 링크명, 기존 상태, 적용 상태, 메시지가 저장됩니다.',
        '적용할 수 없는 링크는 오류 메시지와 함께 남습니다.'
      ]
    },
    sharedparambatch: {
      userGuide: 'Revit에 연결된 공유 매개변수 TXT에서 파라미터를 골라 여러 프로젝트 파일에 프로젝트 파라미터로 일괄 추가하는 기능입니다.',
      setup: [
        '공유파라미터 선택 영역에서 추가할 파라미터를 검색하고 선택합니다. 목록은 Revit 관리 > 공유 매개변수에 연결된 TXT에서 읽습니다.',
        '선택한 파라미터를 어떤 카테고리에 추가할지 카테고리 매핑을 설정합니다.',
        '바인딩 모드에서 인스턴스 또는 타입을 선택합니다.',
        '추가할 파라미터 그룹을 지정합니다. 예를 들어 Text 같은 Revit 파라미터 그룹을 선택합니다.',
        'RVT 등록 창에서 적용 대상 파일을 추가하고, 워크셰어링 파일 저장/동기화 옵션을 확인합니다.'
      ],
      run: [
        '공유파라미터, 카테고리, 바인딩, 대상 RVT가 준비되면 연동 실행을 누릅니다.',
        '각 RVT를 열어 선택 파라미터를 지정 카테고리에 프로젝트 파라미터로 추가합니다.',
        '이미 같은 파라미터가 있으면 중복 추가하지 않고 상태만 기록합니다.',
        '실행 후 엑셀 내보내기로 처리 로그를 저장합니다.'
      ],
      result: [
        '추가됨, 이미 있음, 실패 건수를 표시합니다.',
        '엑셀에는 파일, 파라미터명, GUID, 카테고리, 바인딩, 처리 상태가 저장됩니다.',
        '공유 매개변수 TXT가 연결되어 있지 않으면 목록을 불러올 수 없으므로 Revit에서 먼저 연결해야 합니다.'
      ]
    }
  };

  const tapDepthSettingDetails = [
    {
      label: '허용 범위',
      description: 'Takeoff Length Projection / Takeoff Length로 계산한 기준 깊이와 실제 묻힘 깊이의 차이를 어디까지 정상으로 볼지 정합니다.',
      example: '회사 기준이 5 mm라면 값 5, 거리 단위 mm를 선택합니다.'
    },
    {
      label: '거리 단위',
      description: '허용 범위에 입력한 숫자를 mm 또는 inch 중 어떤 단위로 해석할지 정합니다.',
      example: '허용 범위 0.25를 1/4 inch로 적용하려면 inch를 선택합니다.'
    },
    {
      label: '검토 범위',
      description: '배관 + 덕트, 배관, 덕트 중 Tap/Saddle을 찾을 공종 범위를 선택합니다.',
      example: '배관 모델만 납품받았다면 배관을 선택해 덕트 계열은 검사하지 않습니다.'
    },
    {
      label: '기능 전용 필터',
      description: 'BQC 공통 필터를 통과한 객체 중 이 기능에서 다시 볼 대상만 파라미터 조건으로 좁힙니다.',
      example: 'Family=Tap; Category=Pipe Fittings로 입력하면 해당 조건을 만족하는 피팅만 묻힘 깊이를 검사합니다.'
    },
    {
      label: '공통 옵션',
      description: '공통 설정의 검토 대상 필터, 제외 필터, 추가 파라미터가 이 기능의 대상과 결과 열에 함께 반영됩니다.',
      example: '공통 제외 필터에 Family Contains Dummy를 두면 Dummy 패밀리는 제외되고, 추가 파라미터 Mark는 엑셀 열로 붙습니다.'
    }
  ];

  const directDuplicateSettingDetails = [
    {
      label: '검토 모드',
      description: '동일 위치와 형상의 객체를 묶는 중복 검토와, 서로 겹치는 객체를 찾는 자체 간섭 검토 중 하나를 선택합니다.',
      example: '같은 배관이 두 번 모델링됐는지 찾을 때는 중복 검토를 선택합니다.'
    },
    {
      label: '허용 오차와 단위',
      description: '좌표나 형상의 미세한 차이를 같은 위치로 인정할 거리 기준을 mm 또는 inch로 지정합니다.',
      example: '0.1 mm 이내 차이를 같은 위치로 보려면 값 0.1, 단위 mm를 선택합니다.'
    },
    {
      label: '범위(Selection)',
      description: '전체 모델, 현재 선택한 요소만, 현재 선택한 요소 제외 중 검사 범위를 정합니다.',
      example: '문제가 의심되는 구역의 요소를 먼저 선택한 뒤 선택한 요소만 검사를 사용합니다.'
    },
    {
      label: '세트와 비교쌍',
      description: '조건으로 요소 세트를 만들고, 자체 간섭에서 어느 세트와 어느 세트 사이만 비교할지 지정합니다.',
      example: 'A 세트는 Category=Pipe Curves, B 세트는 Category=Duct Curves로 만들고 A vs B 비교쌍을 추가합니다.'
    },
    {
      label: '제외 세트와 제외 목록',
      description: '검사에서 빼야 할 조건 세트 또는 모델 패밀리/시스템을 지정합니다.',
      example: '단열재 세트를 제외 세트로 등록하거나, 제외 목록에서 Flex Pipe 계열을 선택합니다.'
    },
    {
      label: '제외 키워드',
      description: '패밀리나 시스템 이름에 포함된 문자열로 대상을 빠르게 제외하며 여러 값은 쉼표로 구분합니다.',
      example: 'Dummy, Temp를 입력하면 이름에 Dummy 또는 Temp가 들어간 항목을 제외합니다.'
    },
    {
      label: '속성 추출',
      description: '검출된 객체와 함께 확인할 파라미터명을 쉼표로 입력합니다.',
      example: 'Mark, Comments를 입력하면 두 값이 결과 엑셀의 보조 열로 추가됩니다.'
    }
  ];

  const manualDetailAdditions = {
    connector: {
      setupLead: '연속성 판정 기준과 결과에 필요한 보조 정보를 순서대로 설정합니다.',
      settingDetails: [
        {
          label: '허용 범위와 단위',
          description: '서로 이어진 후보로 비교할 커넥터 사이의 거리 기준을 숫자와 inch/mm 단위로 정합니다.',
          example: '1 mm 이내의 커넥터를 연결 후보로 보려면 허용 범위 1, 단위 mm를 선택합니다.'
        },
        {
          label: '검토 파라미터',
          description: 'Revit에 연결된 공유 매개변수 TXT에서 값의 연속성을 확인할 파라미터를 하나 이상 선택합니다.',
          example: '배관 흐름의 라인 번호를 검사하려면 KKY_LineNo를 검색해 선택합니다.'
        },
        {
          label: '좌표 X/Y 추출',
          description: '판정에는 영향을 주지 않고 결과 엑셀에 각 요소의 X/Y 위치 열을 추가합니다.',
          example: '오류 위치를 평면에서 바로 찾고 싶을 때 켭니다.'
        },
        {
          label: '선형 길이 / 방향 벡터 추출',
          description: '선형 객체의 길이와 Direction X/Y/Z 값을 결과에 추가합니다.',
          example: '같은 라인 번호 오류 중 방향이 반대인 배관을 구분하려면 켭니다.'
        },
        {
          label: '파라미터 값 일치 처리 매핑',
          description: '선택 파라미터의 실제 값을 스캔하고, 서로 다른 표기를 같은 비교 그룹으로 묶습니다. 현재값과 쉼표로 구분한 매핑값은 양방향으로 동일하게 판정되며 모델에는 값을 쓰지 않습니다.',
          example: '현재값 STS304의 매핑값에 STS, SUS304를 입력하면 STS304↔STS, STS304↔SUS304, STS↔SUS304를 모두 같은 값으로 봅니다.'
        },
        {
          label: '매핑 스캔과 Excel',
          description: '활성 문서 또는 등록한 여러 RVT에서 고유값을 읽습니다. 기본 양식 저장, Excel 데이터 가져오기, 스캔 값 Excel 저장으로 매핑표를 왕복할 수 있습니다.',
          example: '여러 RVT 스캔으로 KKY_LineNo의 고유값을 모은 뒤 CHWS, 냉수공급, CHILLED WATER SUPPLY를 한 행에 묶어 적용합니다.'
        },
        {
          label: 'End + Dummy 패밀리 제외',
          description: '같은 패밀리명에 End와 Dummy가 모두 들어간 요소가 연결 쌍의 한쪽이라도 있으면 해당 연결 결과를 제외합니다. 대소문자는 구분하지 않으며 타입명은 사용하지 않습니다.',
          example: 'PipeEndDummy와 Dummy_End는 제외되지만 PIPE_END, Dummy Cap처럼 한 단어만 포함된 패밀리는 계속 검토합니다.'
        },
        {
          label: '공통 설정',
          description: '공통 포함/제외 필터는 검사 대상을 제한하고, 추가 파라미터는 결과 엑셀의 참고 열로 붙습니다.',
          example: '포함 필터를 Category=Pipe Curves로 두고 추가 파라미터에 Mark를 입력합니다.'
        }
      ],
      run: [
        '공통 설정을 적용한 뒤 검토 파라미터와 허용 범위를 확인합니다.',
        '같은 뜻의 표기값이 있으면 값 매핑 설정 열기에서 파라미터를 선택하고 모델을 스캔한 뒤 같은 값 그룹을 작성해 반영합니다.',
        '현재 모델만 볼 때는 활성 문서 검토를 누릅니다. 열린 호스트 문서가 여러 개면 대상 문서를 고른 뒤 실행합니다.',
        '파일 묶음을 볼 때는 여러 RVT 검토에서 파일을 등록하고 체크된 RVT를 실행합니다.',
        '완료 후 불연속 건과 정상 건을 확인하고, 위치 정보가 필요하면 설정한 보조 열이 포함된 엑셀을 내보냅니다.'
      ]
    },
    unconnected: {
      setupLead: '기본 미연결 검사는 항상 수행되며, 중심축과 묻힘 검사는 필요한 경우에만 같은 결과에 추가합니다.',
      settingDetails: [
        {
          label: '기본 미연결 검사',
          description: '별도 값을 입력하지 않아도 커넥터가 있는 객체를 수집해 모든 커넥터가 연결됐는지 검사합니다.',
          example: '배관 피팅의 커넥터 3개 중 1개가 비어 있으면 일부오류로 기록됩니다.'
        },
        {
          label: '중심축 연결 검토 함께 실행',
          description: '켜면 연결된 객체의 중심축 이탈을 미연결 결과에 추가하며, 아래 허용 범위와 거리 단위를 사용합니다.',
          example: '허용 범위 0.5, 단위 mm로 두면 중심축 차이가 0.5 mm를 넘는 경우만 오류로 추가됩니다.'
        },
        {
          label: 'Tap, Saddle 묻힘 검토 함께 실행',
          description: '켜면 두 Takeoff Length 기준 묻힘 깊이 검사를 같은 엑셀에 별도 Check로 추가합니다.',
          example: '허용 범위 5 mm로 두면 기준 깊이와 실제 깊이의 차이가 5 mm를 넘을 때 묻힘 오류로 기록됩니다.'
        },
        {
          label: '공통 설정',
          description: '검토 대상/제외 필터로 객체 범위를 정하고, 추가 파라미터를 결과의 참고 열로 출력합니다.',
          example: 'Duct Accessories만 검사하고 싶다면 공통 포함 필터에 해당 카테고리를 지정합니다.'
        }
      ],
      run: [
        '중심축 검사와 묻힘 검사를 결과에 포함할지 먼저 결정하고, 켠 항목의 허용 범위와 단위를 입력합니다.',
        '활성 문서 또는 여러 RVT 검토를 실행하면 기본 미연결 결과와 선택한 보조 검사가 한 작업으로 처리됩니다.',
        '결과에서 오류, 일부오류, 중심축 오류, 묻힘 오류를 구분해 확인합니다.',
        '엑셀에는 켜 둔 검사만 별도 Check와 결과 열로 포함됩니다.'
      ]
    },
    floorinfo: {
      setupLead: '현재 문서의 레벨을 영역 경계로 정하고, 각 영역에 기대하는 파라미터 값을 입력합니다.',
      settingDetails: [
        {
          label: '층정보 파라미터명',
          description: '모델 객체에서 실제 층 또는 영역 코드가 저장되는 파라미터 이름을 입력합니다.',
          example: '프로젝트에서 FloorInfo 파라미터에 1F, 2F를 기록한다면 FloorInfo를 입력합니다.'
        },
        {
          label: '레벨 새로고침',
          description: '현재 활성 호스트 문서의 레벨명과 절대 Z를 다시 읽어 영역 설정 표를 갱신합니다.',
          example: 'Level 3을 새로 만든 뒤 설정을 열었다면 레벨 새로고침을 눌러 목록에 반영합니다.'
        },
        {
          label: '영역 경계 사용',
          description: '체크한 레벨만 층 영역의 시작 경계로 사용하고, 체크하지 않은 중간 레벨은 구간 계산에서 제외합니다.',
          example: 'Level 1과 Level 2만 체크하면 Level 1부터 Level 2 직전까지가 첫 번째 영역이 됩니다.'
        },
        {
          label: '기대 층정보 값',
          description: '각 경계 레벨에서 시작하는 영역 안의 객체가 가져야 할 파라미터 값을 입력합니다.',
          example: 'Level 1 행에 1F, Level 2 행에 2F를 입력하면 각 높이 구간의 FloorInfo 값과 비교합니다.'
        },
        {
          label: '공통 설정',
          description: '포함/제외 필터는 검사할 객체를 제한하고, 추가 파라미터는 결과 엑셀의 참고 열로 추가합니다.',
          example: 'Equipment만 검사하려면 포함 필터에 Category=Mechanical Equipment를 지정합니다.'
        }
      ],
      run: [
        '검토 기준이 될 호스트 문서를 활성화하고 레벨 새로고침을 실행합니다.',
        '층정보 파라미터명, 사용할 경계 레벨, 각 구간의 기대값을 입력한 뒤 설정을 적용합니다.',
        '활성 문서 또는 같은 레벨 체계를 사용하는 여러 RVT를 실행합니다.',
        '결과에서 판정 구간, 기대값, 실제값을 비교해 잘못 입력된 층정보를 확인합니다.'
      ]
    },
    familysuitability: {
      setupLead: '승인 조합이 들어 있는 기준 엑셀과 결과에 표시할 판정 문구를 설정합니다.',
      settingDetails: [
        {
          label: '기준 엑셀',
          description: 'Category/카테고리, Family/패밀리, Type/타입 헤더가 있는 엑셀을 선택합니다. 열 순서는 달라도 됩니다.',
          example: '한 행에 Pipe Fittings / KKY_Elbow / 100A를 적으면 그 조합을 승인 기준으로 읽습니다.'
        },
        {
          label: '기준 일치 문구',
          description: '실제 사용 타입이 기준 엑셀 조합과 일치할 때 결과에 기록할 문구입니다.',
          example: '승인 타입을 정상으로 표시하려면 기준 리스트와 일치를 입력합니다.'
        },
        {
          label: '기준 미일치 문구',
          description: '기준 엑셀에 없는 카테고리/패밀리/타입 조합에 기록할 문구입니다.',
          example: '기준 리스트에 없는 조합을 입력하면 미승인 타입의 검토 문구로 사용됩니다.'
        },
        {
          label: '이름 포함 필터',
          description: '패밀리/타입, 패밀리, 타입 중 대상을 고르고 포함 키워드가 맞는 항목에 별도 출력 문구를 우선 적용합니다. 여러 규칙은 OR로 동작합니다.',
          example: '대상 패밀리, 포함 키워드 CON_, 출력 문구 시공사 패밀리로 두면 이름에 CON_이 있는 패밀리에 해당 문구가 우선 표시됩니다.'
        },
        {
          label: '설정 저장 / 불러오기',
          description: '기준 엑셀과 판정 문구, 이름 필터 조합을 이름 붙여 다시 사용할 수 있습니다.',
          example: '설정 이름에 기계 납품 기본을 입력해 저장하면 다음 프로젝트에서 그대로 불러올 수 있습니다.'
        }
      ],
      run: [
        '처음이면 기본 양식 추출로 엑셀 구조를 확인한 뒤 승인 조합을 작성합니다.',
        '기준 엑셀을 선택하고 일치/미일치 문구와 필요한 이름 필터를 적용합니다.',
        '활성 문서 또는 여러 RVT를 실행하면 모델에 실제 사용된 타입 조합만 기준표와 비교합니다.',
        '결과에서 부적합 타입과 정상 타입을 확인하고 판정 문구가 포함된 엑셀을 저장합니다.'
      ]
    },
    tapalign: {
      setupLead: '축 이탈 허용값, 공종 범위, 이 기능에만 적용할 추가 필터를 설정합니다.',
      settingDetails: [
        {
          label: '허용 범위',
          description: '탭/분기 피팅의 축이 연결 배관 또는 덕트 중심축에서 벗어나도 정상으로 볼 최대 거리를 정합니다.',
          example: '0.5 mm까지 허용하려면 값 0.5를 입력합니다.'
        },
        {
          label: '거리 단위',
          description: '허용 범위 숫자를 mm 또는 inch 중 어떤 단위로 해석할지 선택합니다.',
          example: '값 1을 1 mm로 사용할 때는 mm를 선택합니다.'
        },
        {
          label: '검토 범위',
          description: '배관 + 덕트, 배관, 덕트 중 축 틀어짐을 검사할 공종을 선택합니다.',
          example: '덕트 탭만 검사하려면 덕트를 선택합니다.'
        },
        {
          label: '기능 전용 필터',
          description: '공통 필터를 통과한 객체 중 이 기능에서만 볼 대상을 추가 조건으로 좁힙니다.',
          example: 'PM1=값; PM2=값2처럼 파라미터 조건을 입력해 대상 피팅을 제한합니다.'
        },
        {
          label: '공통 옵션',
          description: '공통 포함/제외 필터와 추가 파라미터 설정을 그대로 사용합니다.',
          example: '추가 파라미터에 Mark를 넣으면 축 이탈 결과에 Mark 열이 추가됩니다.'
        }
      ],
      run: [
        '허용 범위, 단위, 검토 공종을 입력하고 필요한 경우 기능 전용 필터를 추가합니다.',
        '활성 문서 또는 여러 RVT 검토를 실행합니다.',
        '중심축 편차가 허용값을 넘은 탭/분기 피팅만 오류로 집계됩니다.',
        '엑셀에서 기준 축, 편차값, 허용값과 공통 추가 파라미터를 함께 확인합니다.'
      ]
    },
    tapdepth: {
      setupLead: '묻힘 깊이의 허용값과 검사할 공종을 정한 뒤 필요한 대상 필터를 추가합니다.',
      settingDetails: tapDepthSettingDetails,
      run: [
        '허용 범위, 거리 단위, 검토 범위를 입력하고 필요하면 기능 전용 필터를 설정합니다.',
        '활성 문서 또는 여러 RVT 검토를 실행합니다.',
        'Takeoff Length 기준과 실제 묻힘 깊이의 차이가 허용값을 넘은 항목을 오류로 확인합니다.',
        '엑셀에서 기준 길이, 실제 깊이, 차이값과 추가 파라미터를 확인합니다.'
      ]
    },
    dupclash: {
      userGuide: 'BQC 실행 세트에서 여러 RVT를 대상으로 중복 객체 또는 자체 간섭 객체를 배치 검토하는 기능입니다. 이 화면에서는 검토 모드만 정하고, 대상 범위는 BQC 공통 필터를 사용합니다.',
      setupLead: 'BQC 배치형 기능은 검토 모드와 공통 필터만 사용합니다. 단독 유틸리티 화면의 세트/비교쌍 설정과는 다릅니다.',
      settingDetails: [
        {
          label: '검토 모드',
          description: '완전히 중복된 객체를 묶는 중복 검토와, 연결되지 않은 겹침을 찾는 자체 간섭 검토 중 하나를 선택합니다.',
          example: '같은 객체가 두 번 들어간 납품 모델을 찾으려면 중복 검토를 선택합니다.'
        },
        {
          label: '공통 포함 필터',
          description: '문서의 모든 객체를 비교하지 않고 파라미터 조건에 맞는 객체만 검토 대상으로 남깁니다. 조건을 여러 개 쓰면 공통 설정에 표시된 OR/AND 형식으로 조합합니다.',
          example: 'Category=Pipes를 입력하면 배관 객체만 중복 또는 간섭 비교 대상으로 사용합니다.'
        },
        {
          label: '공통 제외 필터',
          description: '포함 필터를 통과했더라도 임시 객체, Dummy 패밀리처럼 검토하지 않을 대상을 제거합니다.',
          example: 'Family=Dummy; Comments=SKIP을 입력해 임시 패밀리와 SKIP 표시 객체를 결과에서 제외합니다.'
        },
        {
          label: '추가 결과 파라미터',
          description: '오류 후보를 식별할 때 필요한 Mark, Comments 같은 파라미터 값을 결과 엑셀의 보조 열로 추가합니다. 판정 자체를 바꾸지는 않습니다.',
          example: 'Mark, System Type을 입력하면 중복 그룹의 각 요소에 있는 두 값이 결과 열에 함께 저장됩니다.'
        },
        {
          label: '단독 화면 규칙과의 차이',
          description: '이 BQC 배치형 화면에서는 단독 유틸리티의 Set, 비교쌍, 허용 오차, 제외 목록을 사용하지 않습니다. 상세 비교 규칙이 필요하면 별도 화면의 중복 / 자체 간섭 검토를 실행합니다.',
          example: 'HVAC Set과 Piping Set 사이만 자체 간섭 검사하려면 BQC 항목이 아니라 별도 화면 기능을 사용합니다.'
        }
      ],
      run: [
        '중복 검토 또는 자체 간섭 검토를 선택하고 BQC 공통 필터를 확인합니다.',
        '활성 문서 검토 또는 여러 RVT 검토를 실행합니다.',
        '여러 RVT에서는 파일 안의 객체를 파일별로 검사하며 서로 다른 RVT 사이를 교차 비교하지 않습니다.',
        '결과에서 중복 그룹 또는 간섭 후보를 확인하고 파일별/통합 엑셀로 저장합니다.'
      ]
    },
    worksetassignment: {
      setupLead: '정상으로 인정할 웍셋 이름과 검사할 객체 범위를 정합니다.',
      settingDetails: [
        {
          label: '정상으로 볼 웍셋 이름',
          description: '허용할 웍셋명을 정확히 입력하며 여러 개는 쉼표로 구분합니다. 비워 두면 Workset1만 정상으로 봅니다.',
          example: 'Workset1, MEP-Pipe를 입력하면 두 웍셋에 배정된 객체는 정상으로 처리합니다.'
        },
        {
          label: '입력값을 비워 둔 경우',
          description: '정상 웍셋 이름을 입력하지 않으면 기본값 Workset1만 정상 웍셋으로 사용합니다. 프로젝트가 다른 이름을 쓰면 반드시 실제 웍셋명을 입력합니다.',
          example: '프로젝트 기본 웍셋이 Shared Levels and Grids라면 빈 상태로 두지 말고 그 이름을 정확히 입력합니다.'
        },
        {
          label: '공통 포함 필터',
          description: '웍셋을 확인할 객체 범위를 카테고리, 패밀리 또는 파라미터 조건으로 제한합니다.',
          example: 'Category=Mechanical Equipment를 입력하면 기계 장비만 현재 웍셋을 검사합니다.'
        },
        {
          label: '공통 제외 필터',
          description: '포함 범위 안에서도 납품 기준상 웍셋 검토가 필요 없는 패밀리나 임시 객체를 제외합니다.',
          example: 'Family=Dummy를 입력하면 Dummy 패밀리는 허용 웍셋 밖에 있어도 오류로 집계하지 않습니다.'
        },
        {
          label: '추가 결과 파라미터',
          description: '오배정 객체를 찾기 쉽게 Mark, Comments 같은 값을 결과 엑셀에 추가합니다.',
          example: 'Mark, System Type을 입력하면 현재/기준 웍셋 옆에 객체의 마크와 시스템 타입이 함께 표시됩니다.'
        }
      ],
      run: [
        '허용 웍셋명을 실제 Revit 웍셋 이름과 같은 철자로 입력합니다.',
        '활성 문서 또는 여러 RVT 검토를 실행합니다.',
        '허용 목록 밖 웍셋에 배정된 객체를 오류로 확인합니다.',
        '프로젝트마다 허용 웍셋이 다르면 기준이 같은 RVT끼리 나눠 실행합니다.'
      ]
    },
    parameterduplication: {
      setupLead: '전체 프로젝트 파라미터를 볼지, 지정한 이름만 볼지 검토 범위를 선택합니다.',
      settingDetails: [
        {
          label: '검토 범위',
          description: '추가된 전체 프로젝트 파라미터 또는 지정 파라미터만 중 하나를 선택합니다.',
          example: '문서 전체를 점검하려면 전체를, KKY_LineNo만 확인하려면 지정 파라미터만을 선택합니다.'
        },
        {
          label: '공유파라미터 검색',
          description: '지정 파라미터 검토에서 사용할 이름을 Revit에 연결된 공유 매개변수 TXT에서 검색해 추가합니다. 목록 항목을 선택하면 지정 검토로 자동 전환됩니다.',
          example: 'KKY_LineNo를 검색해 추가하면 같은 이름의 프로젝트 파라미터 등록 수만 검사합니다.'
        },
        {
          label: '최근 검토 항목',
          description: '최근 적용한 전체/지정 검토 구성을 자동 기록하고 다시 불러옵니다.',
          example: '지난번에 선택한 KKY_LineNo, KKY_AreaCode 조합을 최근 항목에서 불러옵니다.'
        }
      ],
      run: [
        '전체 또는 지정 검토 범위를 선택하고, 지정 검토라면 파라미터를 하나 이상 추가합니다.',
        '활성 문서 또는 여러 RVT 검토를 실행합니다.',
        '각 문서에 추가된 프로젝트 파라미터를 이름별로 묶어 등록 수가 2개 이상인 이름을 오류로 확인합니다.',
        '선택한 이름은 결과에서 파라미터 이름만 표시되며 GUID 일부는 선택 목록 라벨에 붙지 않습니다.'
      ]
    },
    parametermissing: {
      setupLead: '누락을 검사할 공유파라미터와, 실제 업무상 빈 값을 허용할 예외 조건을 함께 설정합니다.',
      settingDetails: [
        {
          label: '누락 검토 파라미터',
          description: 'Revit에 연결된 공유 매개변수 TXT에서 값이 비어 있는지 확인할 파라미터를 선택합니다.',
          example: 'KKY_LineNo와 KKY_AreaCode를 선택하면 두 파라미터를 객체별로 각각 검사합니다.'
        },
        {
          label: '전용 객체 필터',
          description: '공통 대상 필터 이후 이 기능에서만 포함 또는 제외할 객체 조건을 추가합니다.',
          example: 'Category Equals Pipe Fittings를 넣으면 배관 피팅만 누락 검토 대상으로 남깁니다.'
        },
        {
          label: '파라미터별 누락 예외',
          description: '선택한 파라미터마다 연관 파라미터, 조건, 값을 지정해 빈 값이어도 오류로 보지 않을 경우를 정의합니다.',
          example: 'KKY_LineNo 예외에 Family Contains Dummy를 넣으면 Dummy 패밀리의 빈 LineNo는 오류에서 제외합니다.'
        },
        {
          label: '예외 조건 결합',
          description: '한 파라미터에 예외 조건이 여러 개일 때 모두 만족해야 하는 And 또는 하나만 만족해도 되는 Or를 선택합니다.',
          example: 'Family Contains Dummy 또는 Type Contains TEMP 중 하나만 맞아도 제외하려면 Or를 선택합니다.'
        },
        {
          label: '최근 설정 / 파일 저장',
          description: '최근 적용한 선택 파라미터와 예외 규칙을 다시 불러오거나 설정 파일로 저장해 다른 작업에서 사용합니다.',
          example: '기계 납품 누락검토 설정을 파일로 저장해 같은 기준의 다음 프로젝트에서 불러옵니다.'
        },
        {
          label: '공통 설정',
          description: '공통 포함/제외 필터와 추가 파라미터를 누락 검토 대상 및 결과 열에 적용합니다.',
          example: '추가 파라미터에 Family and Type을 넣으면 누락 행에서 해당 정보를 같이 확인할 수 있습니다.'
        }
      ],
      run: [
        '검토 파라미터를 선택하고 필요한 전용 필터와 파라미터별 예외를 설정합니다.',
        '활성 문서 또는 여러 RVT 검토를 실행합니다.',
        '대상 객체의 인스턴스/타입 값을 확인해 빈 값을 누락으로 판정하고, 예외 조건이 맞는 행은 오류에서 뺍니다.',
        '결과에서 누락 파라미터명, 객체 정보, 예외 적용 여부를 확인합니다.'
      ]
    },
    parameterstandard: {
      setupLead: '엑셀 시트 하나를 파라미터 하나의 허용값 목록으로 구성합니다.',
      settingDetails: [
        {
          label: '기본 양식 추출',
          description: '기준 엑셀의 시트명, B1, B2 이하 구조를 확인할 수 있는 샘플 파일을 저장합니다.',
          example: '처음 사용할 때 양식을 내려받아 제조사 시트를 복사해 새 기준을 만듭니다.'
        },
        {
          label: '시트명과 B1',
          description: '시트명은 실제 검토할 파라미터명이며 B1은 확인용 이름입니다. 둘이 다르면 시트명을 기준으로 검사합니다.',
          example: '시트명 제조사, B1 제조사로 작성하면 모델의 제조사 파라미터를 검사합니다.'
        },
        {
          label: 'B2 아래 허용값',
          description: 'B2부터 아래 방향으로 한 셀에 하나씩 정상으로 인정할 값을 입력합니다.',
          example: 'B2 KKY, B3 ABC를 입력하면 제조사 값이 KKY 또는 ABC인 객체는 정상입니다.'
        },
        {
          label: '공란 허용',
          description: '허용값 목록에 (공란)을 넣으면 실제 빈 파라미터 값도 정상으로 통과합니다.',
          example: 'B4에 (공란)을 입력하면 제조사가 비어 있는 객체도 오류로 보지 않습니다.'
        },
        {
          label: '공통 설정',
          description: '스케줄 가능한 모델 객체 중 공통 포함/제외 필터를 통과한 대상을 검사하고 추가 파라미터를 결과에 붙입니다.',
          example: '공통 필터로 Mechanical Equipment만 남기고 Mark를 추가 열로 출력합니다.'
        }
      ],
      run: [
        '기본 양식 구조에 맞춰 파라미터별 시트와 허용값을 작성합니다.',
        '기준 엑셀을 선택해 시트 수, 기준 파라미터 수, 허용값 수와 경고를 확인합니다.',
        '활성 문서 또는 여러 RVT 검토를 실행합니다.',
        '결과에서 기준 파라미터, 허용값, 실제값과 공란 허용 여부를 확인합니다.'
      ]
    },
    deliverycleaner: {
      setupLead: '납품 파일을 어디에 만들고 어떤 뷰·파라미터·필터·V/G 규칙을 적용할지 단계별로 지정합니다.',
      settingDetails: [
        {
          label: '정리 결과 폴더',
          description: '원본 RVT를 정리한 결과 파일과 로그를 저장할 폴더입니다. 정리 시작 전에 반드시 지정합니다.',
          example: 'D:\\Delivery\\Cleaned처럼 원본과 분리된 납품 폴더를 선택합니다.'
        },
        {
          label: '정리용 3D 뷰 이름',
          description: '정리·검토 기준으로 만들거나 사용할 3D 뷰의 이름입니다.',
          example: 'KKY_CLEAN_3D를 입력해 모든 납품 RVT에서 같은 뷰 이름을 사용합니다.'
        },
        {
          label: '뷰 파라미터',
          description: '정리용 3D 뷰에 입력할 파라미터명과 값을 최대 5개까지 지정합니다.',
          example: '파라미터 Comments, 값 납품용으로 입력해 생성된 3D 뷰에 표시합니다.'
        },
        {
          label: '객체 파라미터',
          description: '최대 4개 조건으로 대상을 찾고 최대 4개 파라미터 값을 입력합니다. 조건 결합은 AND/OR, 중복 이름은 하나만 또는 전체 입력으로 정합니다.',
          example: '조건 Family Contains Dummy, 입력 Comments=납품 제외 후보로 설정합니다.'
        },
        {
          label: '뷰 필터',
          description: '필터 사용, 최초 열기 시 적용, 뷰가 비면 자동 활성화를 정하고 XML 또는 현재 문서 필터에서 카테고리와 조건을 가져옵니다.',
          example: '현재 문서 필터 추출로 Pipe 검토 필터를 가져오고 최초 열기 시 적용을 켭니다.'
        },
        {
          label: 'Imported Categories',
          description: 'Show imported categories in this view와 Imports in Families를 각각 켜거나 꺼 정리용 3D 뷰의 가져오기 표시 상태를 정합니다.',
          example: '패밀리 내부 CAD를 숨기려면 Imports in Families를 끕니다.'
        },
        {
          label: '서브카테고리 숨김 규칙',
          description: '카테고리 표시 여부와 하위 서브카테고리 이름 규칙을 별도 창에서 지정합니다.',
          example: 'Pipe Fittings 아래 End Cut 서브카테고리를 숨김 규칙으로 추가합니다.'
        },
        {
          label: '속성값 추출 파라미터',
          description: '정리 후 속성값 추출을 실행할 때 엑셀로 뽑을 파라미터명을 쉼표로 입력합니다.',
          example: 'Comments, Mark, Type Comments를 입력해 정리 결과의 객체 속성을 확인합니다.'
        }
      ],
      run: [
        '대상 RVT를 등록하고 정리 결과 폴더와 3D 뷰 이름을 먼저 지정합니다.',
        '필요한 뷰/객체 파라미터, 뷰 필터, V/G 규칙을 확인한 뒤 정리 시작을 실행합니다.',
        '정리가 끝나면 정리 결과 검토, 속성값 추출, 불필요 항목 제거를 목적에 따라 각각 실행합니다.',
        '각 처리 결과는 해당 결과창에서 확인하고 필요한 비교표나 로그 엑셀을 따로 저장합니다.'
      ]
    },
    conditionextract: {
      setupLead: '객체를 고르는 필터와 결과로 뽑을 값, 출력 단위를 각각 설정합니다.',
      settingDetails: [
        {
          label: '조건 결합',
          description: '필터 행을 모두 만족해야 하는 And 또는 하나만 만족해도 되는 Or로 결합합니다.',
          example: 'Category=Pipe Curves와 System Type Contains CHW를 모두 만족해야 하면 And를 선택합니다.'
        },
        {
          label: '필터 파라미터 / 연산자 / 값',
          description: '인스턴스에서 먼저 찾고 없으면 타입 파라미터를 검사합니다. Equals, Contains, Greater, HasValue 등 연산자를 선택합니다.',
          example: '파라미터 System Type, 연산자 Contains, 값 CHW를 입력합니다.'
        },
        {
          label: '추출 파라미터 목록',
          description: '결과 엑셀로 가져올 파라미터명을 쉼표로 구분해 입력합니다.',
          example: 'Comments, Mark, Type Comments, Area를 입력합니다.'
        },
        {
          label: '좌표 추출',
          description: '객체 위치를 X/Y/Z 열로 추가하며 좌표/길이 단위 설정을 따릅니다.',
          example: '오류 위치를 좌표로 전달해야 할 때 좌표 추출을 켭니다.'
        },
        {
          label: '선형 객체 방향 / 길이 추출',
          description: '선형 객체에 DirectionX/Y/Z와 Length 열을 추가합니다.',
          example: '배관의 방향과 길이를 함께 비교하려면 이 옵션을 켭니다.'
        },
        {
          label: '좌표/길이 · 면적 · 체적 단위',
          description: '길이 계열은 mm/m/inch/ft, 면적과 체적은 대응 제곱·세제곱 단위로 변환합니다.',
          example: '길이 m, 면적 m^2, 체적 m^3로 선택해 SI 단위로 통일합니다.'
        }
      ],
      run: [
        '필요한 필터 행을 추가하고 추출 파라미터 또는 좌표/선형 옵션을 하나 이상 설정합니다.',
        '현재 모델만 볼 때는 활성 문서 검토, 현재 모델과 연결된 Revit 링크까지 볼 때는 활성 문서 + 링크 검토를 선택합니다.',
        '독립 RVT 묶음은 여러 RVT 검토 창에서 파일을 등록해 실행합니다.',
        '조건을 통과한 객체 수와 추출 행을 확인하고 선택한 단위의 엑셀을 저장합니다.'
      ]
    },
    dup: {
      setupLead: '단독 화면에서는 비교 범위와 세트, 제외 조건을 세밀하게 구성할 수 있습니다.',
      settingDetails: directDuplicateSettingDetails,
      run: [
        '현재 Revit 문서에서 검사할 요소를 선택할지 전체를 볼지 범위를 먼저 정합니다.',
        '검토 모드, 허용 오차, 비교쌍과 제외 규칙을 설정한 뒤 검토 시작을 누릅니다.',
        '중복 검토는 그룹 단위, 자체 간섭은 객체 쌍 단위로 중앙 결과에 표시됩니다.',
        '결과를 검토해 삭제 후보를 표시하고 전체 상세가 필요하면 엑셀로 내보냅니다.'
      ]
    },
    paramprop: {
      userGuide: '현재 활성 문서의 복합 패밀리를 검사해 선택한 공유파라미터를 하위 패밀리에 추가하고 상위-하위 연동을 구성하는 기능입니다.',
      setupLead: '추가할 공유파라미터, 처리할 패밀리 범위, 바인딩과 저장 방식을 정합니다.',
      settingDetails: [
        {
          label: '공유파라미터 선택',
          description: 'Revit에 연결된 공유 매개변수 TXT에서 하위 패밀리에 추가하거나 연동할 파라미터를 선택합니다.',
          example: 'KKY_LineNo를 검색해 선택하면 해당 파라미터만 패밀리 구조에 적용합니다.'
        },
        {
          label: "하위 패밀리 'Dummy' 포함 요소 제외",
          description: '이름에 Dummy가 포함된 하위 패밀리를 스캔과 적용 대상에서 제외합니다.',
          example: '연동용이 아닌 Dummy Connector 패밀리를 건너뛰려면 켭니다.'
        },
        {
          label: '단일 패밀리까지 파라미터 추가',
          description: '중첩 하위 패밀리가 없는 단일 패밀리에도 파라미터를 추가하지만 상위-하위 연동 검사는 하지 않습니다.',
          example: '복합 패밀리뿐 아니라 단일 밸브 패밀리에도 KKY_LineNo를 추가하려면 켭니다.'
        },
        {
          label: '바인딩',
          description: '선택 파라미터를 패밀리 인스턴스 값으로 둘지 타입 공통값으로 둘지 정합니다.',
          example: '같은 타입의 모든 객체가 같은 값을 써야 하면 타입을 선택합니다.'
        },
        {
          label: 'Parameter Group',
          description: 'Revit 속성 팔레트에서 새 파라미터가 표시될 그룹을 선택합니다.',
          example: '일반 데이터 성격이면 Data를 선택합니다.'
        },
        {
          label: '수정된 패밀리(.rfa) 파일 저장',
          description: '처리한 패밀리 파일을 지정 폴더에 별도로 저장할지 정합니다.',
          example: 'D:\\Family\\Updated를 선택해 변경된 RFA를 원본과 분리해 보관합니다.'
        }
      ],
      run: [
        '처리할 프로젝트 문서를 활성화하고 Revit 공유 매개변수 TXT 연결 상태를 확인합니다.',
        '파라미터와 적용 범위, 바인딩, Parameter Group, 저장 옵션을 설정합니다.',
        '연동 실행을 누르면 대상 패밀리를 수집해 파라미터 추가와 상위-하위 연동을 순서대로 처리합니다.',
        '결과에서 추가됨, 이미 있음, 연동됨, 건너뜀, 오류를 확인하고 보고서 엑셀을 저장합니다.'
      ],
      result: [
        '처리한 패밀리 수와 추가/연동/건너뜀/오류 상태가 표시됩니다.',
        '상세 결과에는 패밀리명, 대상 공유파라미터, 수행 작업과 메시지가 기록됩니다.',
        'RFA 저장을 켠 경우 지정 폴더에서 수정된 패밀리 파일을 확인할 수 있습니다.'
      ]
    },
    segmentpms: {
      setupLead: 'RVT 추출 결과와 PMS 기준표를 준비한 뒤 Revit 그룹을 PMS 세그먼트에 매핑합니다.',
      settingDetails: [
        {
          label: '추출 대상 RVT',
          description: '파일 추가, 폴더 선택, 드래그 앤 드롭으로 Segment 정보를 뽑을 RVT를 등록합니다.',
          example: '공종 폴더를 선택해 그 안의 납품 RVT를 한 번에 등록합니다.'
        },
        {
          label: '추출 결과',
          description: 'RVT에서 새로 추출하거나 이전에 저장한 추출 엑셀을 불러와 2단계 검토에 사용합니다.',
          example: '어제 추출한 파일이 있다면 RVT를 다시 열지 않고 추출 결과 불러오기를 사용합니다.'
        },
        {
          label: 'PMS 기준표',
          description: 'PMS 양식 추출하기로 받은 구조에 맞춰 기준 데이터를 작성한 뒤 PMS 등록/업데이트로 불러옵니다.',
          example: '샘플 양식의 PMS Segment와 OD/ID 열을 채워 등록합니다.'
        },
        {
          label: '그룹 매핑',
          description: '각 Revit 세그먼트 그룹의 사용처와 대응할 PMS 세그먼트를 선택합니다.',
          example: 'Revit 그룹 CHW-PIPE를 PMS 세그먼트 CHW에 매핑합니다.'
        },
        {
          label: '추천 적용',
          description: '이름이나 값으로 자동 추천된 PMS 세그먼트가 맞을 때 추천값을 선택에 반영합니다.',
          example: 'CHW 이름이 일치해 추천된 CHW 세그먼트를 확인한 뒤 추천 적용을 누릅니다.'
        }
      ],
      run: [
        '1단계에서 RVT 추출을 실행하고 필요하면 추출 결과 엑셀을 저장합니다.',
        '2단계에서 PMS 기준표를 등록한 뒤 매핑 준비를 실행합니다.',
        '그룹별 추천과 선택값을 검토한 뒤 검토 시작을 누릅니다.',
        '정상, 검토 필요, 오류 결과를 확인하고 비교 결과 엑셀을 저장합니다.'
      ]
    },
    parammodifier: {
      setupLead: '대상 객체를 찾는 조건과 실제로 입력할 파라미터 값을 분리해 설정합니다.',
      settingDetails: [
        {
          label: '조건 결합',
          description: '최대 4개 조건을 모두 만족시키는 And 또는 하나만 만족해도 되는 Or로 결합합니다.',
          example: 'Category=Pipe Curves와 System Type Contains CHW를 모두 만족해야 하면 And를 선택합니다.'
        },
        {
          label: '조건 파라미터 / 연산자 / 값',
          description: '대상 객체를 찾을 기준을 입력하며 Equals, Contains, Greater, HasValue 등 연산자를 사용할 수 있습니다.',
          example: '파라미터 Comments, 연산자 Contains, 값 REVIEW를 입력합니다.'
        },
        {
          label: '입력 파라미터 / 값',
          description: '조건을 통과한 객체에 실제로 쓸 파라미터명과 새 값을 최대 4개까지 입력합니다.',
          example: '입력 파라미터 Status, 값 Approved를 입력합니다.'
        },
        {
          label: '활성 문서 작업 후 동기화',
          description: '활성 워크셰어링 문서에 적용한 뒤 중앙 모델과 동기화할지 선택하고 코멘트를 입력합니다.',
          example: '옵션을 켜고 코멘트에 KKY - Status 일괄 수정이라고 입력합니다.'
        },
        {
          label: '여러 RVT 동기화 코멘트',
          description: '여러 RVT 적용 창에서 파일 작업 후 동기화할 때 기록할 별도 코멘트입니다.',
          example: '파라미터 수정기 일괄 입력을 코멘트로 사용합니다.'
        }
      ],
      run: [
        '조건과 입력 파라미터를 작성하고 변경 범위가 의도한 대상과 맞는지 다시 확인합니다.',
        '현재 모델은 활성 문서 적용, 파일 묶음은 여러 RVT 적용을 선택합니다.',
        '실행하면 조건을 만족하는 객체에 입력값을 쓰고 파일별 성공/실패를 기록합니다.',
        '완료 후 변경 수와 실패 메시지를 확인합니다. 값 수정 작업이므로 실행 전 원본 보관 상태도 확인합니다.'
      ]
    },
    linkpath: {
      setupLead: '먼저 현재 링크 현황을 Excel v2로 추출하고, Action을 명시한 행만 다시 적용한다. 빈 대상 경로는 삭제 의미가 아니다.',
      settingDetails: [
        {
          label: '대상 RVT',
          description: 'Revit 링크를 읽거나 변경할 호스트 RVT를 등록합니다.',
          example: 'A-Main.rvt와 M-Main.rvt를 등록해 두 파일의 링크 현황을 함께 추출합니다.'
        },
        {
          label: '추출 Excel과 입력 열',
          description: '최신 양식은 Action, HostFileName/HostFilePath, ReferenceElementId, 현재 경로·상태, 적용 웍셋, 대상 경로를 함께 보관한다. 노란색 입력 열(Action, ApplyTypeWorksetNames, ApplyInstanceWorksetNames, TargetLinkPath, TargetPathType)만 수정하고 식별·현재 상태 열은 유지한다.',
          example: '건축 링크 경로를 바꿀 때 Action을 Reload From으로 고르고 TargetLinkPath에 D:\\Links\\A-Link.rvt를 입력한다.'
        },
        {
          label: 'Action=유지',
          description: '추출된 기존 링크의 기본값이다. 이 행은 변경하지 않으며 TargetLinkPath, TargetPathType, 적용 웍셋도 비워 두거나 현재값으로 되돌려야 한다. 유지 행에 변경값을 입력하면 적용 전에 오류로 막는다.',
          example: '현재 경로를 단순히 기록만 남길 구조 링크는 Action=유지로 두고 대상 경로와 적용 웍셋을 비워 둔다.'
        },
        {
          label: 'Action=Reload From',
          description: '추출된 기존 링크의 경로를 바꾸거나 같은 경로를 다시 로드할 때 사용한다. ReferenceElementId가 있는 기존 행이어야 하고 TargetLinkPath는 필수다. 웍셋만 바꾸더라도 Reload From을 선택한다.',
          example: 'A-Main.rvt의 A-Struct 링크에 새 경로를 입력한다. 경로는 그대로 두고 인스턴스 웍셋만 LINK-ARCH로 바꿀 때도 Action=Reload From을 선택한다.'
        },
        {
          label: 'Action=신규 링크',
          description: '같은 호스트의 추출 행을 복사하고 Action=신규 링크와 TargetLinkPath를 입력해 새 파일 링크를 만든다. 최신 양식에서는 복사된 ReferenceElementId나 LinkName을 지울 필요가 없으며 신규 Action에서 자동으로 무시한다. 신규 링크 배치는 화면의 전역 옵션을 따른다.',
          example: 'M-Main.rvt의 기존 행을 한 줄 복사한 뒤 Action을 신규 링크, TargetLinkPath를 D:\\Links\\C-Main.rvt로 바꾼다. 필요한 타입/인스턴스 웍셋은 각각 한 이름만 Apply 열에 넣는다.'
        },
        {
          label: 'Action=삭제',
          description: '삭제는 추출된 기존 링크 행에서만 가능하다. Action을 삭제로 명시하고 TargetLinkPath를 비워 둔다. 대상 경로가 비어 있어도 Action=유지라면 삭제하지 않는다.',
          example: '더 이상 사용하지 않는 A-Old 링크 행의 Action만 삭제로 바꾸고 TargetLinkPath와 적용 웍셋을 비운 뒤 적용한다.'
        },
        {
          label: '경로 방식과 적용 웍셋',
          description: 'TargetPathType은 Relative, Absolute, Server 중 하나이며 비우면 기존 링크는 CurrentPathType을 유지하고 신규 링크는 경로 형식으로 판단한다. Apply 타입/인스턴스 웍셋은 각각 하나의 사용자 웍셋 이름만 입력할 수 있다.',
          example: 'RSN 경로라면 TargetPathType=Server를 입력한다. 일반 파일 경로에 Server를 쓰거나 여러 웍셋을 세미콜론으로 넣으면 적용 전에 오류가 난다.'
        },
        {
          label: '링크 상태와 신규 링크 배치 방식',
          description: 'LinkedFileStatus는 읽기 전용 참고 정보다. Loaded는 정상, Unloaded/LocallyUnloaded는 주의, NotFound/Invalid/Error는 경로·파일 상태를 먼저 확인해야 한다. 신규 링크가 있을 때만 원점·중심·공유좌표·프로젝트 기준점 중 배치 방식을 고른다.',
          example: 'NotFound 행은 대상 경로를 입력하기 전에 실제 파일과 접근 권한을 확인한다. 공유좌표가 아직 준비되지 않았다면 신규 링크 배치를 프로젝트 기준점으로 선택한다.'
        }
      ],
      run: [
        'RVT를 등록하고 링크 추출을 실행한 뒤 현재 경로와 링크 상태를 확인하고 Excel로 내보낸다.',
        'Excel에서 작업이 필요한 행만 Action과 노란색 입력 열을 작성한다. 유지 행은 입력값을 비워 두고, 삭제는 반드시 Action=삭제로 명시한다.',
        '수정한 Excel을 선택하고 신규 링크가 있을 때만 배치 방식을 확인한 뒤 Excel 기준 적용을 실행한다.',
        '적용은 호스트별·행별로 저장/동기화와 재확인을 거친다. 일부 행 실패는 다른 호스트나 이미 확인된 행을 되돌리지 않으며, 치명적인 문서 정리 실패만 남은 배치를 중단한다.',
        '결과에서 실행/오류/주의 행의 원인·조치를 먼저 확인하고, 필요한 행만 기술 상세를 펼쳐 재실행 조건을 확인한다.'
      ]
    },
    lateralnozzle: {
      setupLead: '사용자가 조정하는 판정 옵션은 없으며, 검사할 KTA 엑셀 목록만 준비합니다.',
      settingDetails: [
        {
          label: '검사 엑셀',
          description: 'xlsx 또는 xls 파일을 추가하며 등록된 각 파일의 모든 시트를 검사합니다.',
          example: 'UTILITY_A.xlsx와 UTILITY_B.xlsx를 함께 끌어 놓아 한 번에 처리합니다.'
        },
        {
          label: '헤더 블록',
          description: 'UT명, 배관No, Nozzle Code, No 헤더가 있는 블록을 자동으로 찾으므로 사용자가 열을 직접 지정하지 않습니다.',
          example: '시트 중간에 헤더가 있어도 네 이름이 맞으면 해당 블록을 검사 대상으로 인식합니다.'
        },
        {
          label: '고정 검사 규칙',
          description: 'UTILITY/LATERAL NO/Nozzle Code 누락, Nozzle Code와 No 연결, 마지막 _000 숫자 3자리 형식을 고정 규칙으로 검사합니다.',
          example: 'No가 12라면 최종 Nozzle Code가 _012로 끝나지 않을 경우 형식 불일치로 표시됩니다.'
        }
      ],
      run: [
        '엑셀 파일을 등록하고 목록에서 실제 처리할 파일이 남아 있는지 확인합니다.',
        '추출 시작을 누르면 모든 시트의 헤더 블록을 찾아 KTA 값을 정리하고 고정 규칙을 검사합니다.',
        '최근 결과에서 처리 파일 수, 추출 건수, 비교 건수를 확인합니다.',
        '완료된 정리 결과를 엑셀로 저장합니다.'
      ]
    },
    guid: {
      setupLead: 'GUID 검토 범위와 삭제용 엑셀 적용 규칙을 설정합니다. 공유파라미터 TXT 상태를 따로 확인하는 설정은 없습니다.',
      settingDetails: [
        {
          label: '대상 RVT',
          description: 'RVT를 등록하면 등록 파일을 검사하고, 목록이 비어 있으면 현재 활성 호스트 문서를 검사합니다.',
          example: '현재 모델 하나만 볼 때는 파일을 추가하지 않고 검토 시작을 누릅니다.'
        },
        {
          label: '패밀리 포함',
          description: '프로젝트 파라미터뿐 아니라 로드된 패밀리의 사용자 파라미터까지 GUID 검토 범위를 확장합니다.',
          example: '프로젝트 안에 로드된 밸브 패밀리의 공유파라미터 GUID도 확인하려면 켭니다.'
        },
        {
          label: '주석 패밀리 포함',
          description: '패밀리 포함이 켜진 경우 Annotation 패밀리까지 추가로 검사합니다.',
          example: '태그 패밀리의 파라미터 GUID도 확인하려면 두 옵션을 모두 켭니다.'
        },
        {
          label: '삭제용 엑셀의 삭제여부',
          description: '검토 결과를 삭제용 엑셀로 내보낸 뒤 삭제할 행에만 삭제라고 입력합니다. 숨김 키 행은 수정하지 않습니다.',
          example: '제거할 파라미터 행의 삭제여부 셀에 삭제를 입력하고 나머지는 비워 둡니다.'
        },
        {
          label: '동기화 코멘트',
          description: '정리 후 워크셰어링 문서를 동기화할 때 코멘트를 남길지와 문구를 정합니다.',
          example: '동기화 시 코멘트 작성을 켜고 KKY Tools - 파라미터 GUID 정리를 입력합니다.'
        }
      ],
      run: [
        'RVT 대상과 패밀리/주석 패밀리 포함 범위를 정한 뒤 GUID 검토를 실행합니다.',
        '검토 결과에서 프로젝트와 패밀리 파라미터를 확인하고 삭제용 엑셀을 내보냅니다.',
        '엑셀의 삭제여부에 삭제할 행만 표시한 뒤 삭제용 엑셀 불러오기로 다시 선택합니다.',
        '정리 시작을 실행하고 파일별 삭제 성공/실패와 동기화 결과를 확인합니다.'
      ]
    },
    tapdepthutility: {
      setupLead: '유틸리티 실행 세트에서도 BQC 묻힘 검토와 같은 허용값과 대상 필터를 사용합니다.',
      settingDetails: tapDepthSettingDetails,
      run: [
        '허용 범위, 단위, 공종과 기능 전용 필터를 설정합니다.',
        '유틸리티에서 이 기능만 선택하거나 다른 선택형 유틸리티와 함께 실행 세트를 만듭니다.',
        '활성 문서 또는 여러 RVT 검토를 실행합니다.',
        '묻힘 깊이 차이가 허용값을 넘은 항목과 정상 항목을 확인하고 엑셀로 저장합니다.'
      ]
    },
    familylink: {
      setupLead: '검토할 공유파라미터와 단일 패밀리까지 검사할지 여부를 정합니다.',
      settingDetails: [
        {
          label: '공유파라미터 검색과 선택',
          description: 'Revit에 연결된 공유 매개변수 TXT에서 이름, 그룹, GUID로 검색해 연동을 확인할 파라미터를 선택합니다.',
          example: 'KKY_LineNo를 선택하면 그 파라미터만 상위-하위 패밀리 연동 상태를 검사합니다.'
        },
        {
          label: '선택된 검토 파라미터',
          description: '실제 검사에 사용될 목록이며 칩을 누르면 선택에서 제거됩니다.',
          example: 'KKY_LineNo와 KKY_AreaCode 두 개만 남겨 두면 두 파라미터만 검사합니다.'
        },
        {
          label: '단일 패밀리 파라미터 추가 여부도 검토',
          description: '중첩 인스턴스가 없는 단일 패밀리에도 선택 파라미터가 추가되어 있는지 함께 확인합니다.',
          example: '단일 밸브 패밀리에도 KKY_LineNo가 있어야 한다면 이 옵션을 켭니다.'
        }
      ],
      run: [
        'Revit 공유 매개변수 TXT 연결 상태를 확인하고 검토 파라미터를 선택합니다.',
        '단일 패밀리 검사 여부를 정한 뒤 활성 문서 또는 여러 RVT 검토를 실행합니다.',
        '복합 패밀리의 하위 파라미터 존재 여부와 상위-하위 연동 상태를 확인합니다.',
        '결과에서 파라미터 없음, 연동 누락, 정상 건을 구분해 엑셀로 저장합니다.'
      ]
    },
    points: {
      userGuide: 'RVT의 프로젝트 기준점, 측량 기준점, 내부 원점 공유좌표, 프로젝트 북각을 선택한 출력 단위로 추출하는 기능입니다.',
      setupLead: '판정 기준은 없고 결과 좌표에 사용할 단위만 선택합니다.',
      settingDetails: [
        {
          label: '단위',
          description: '기준점 좌표를 십진 피트, 미터(m), 밀리미터(mm) 중 어떤 단위로 출력할지 선택합니다. 북각 값은 각도 정보로 별도 기록됩니다.',
          example: '현장 좌표를 mm로 전달해야 한다면 밀리미터(mm)를 선택합니다.'
        },
        {
          label: '프로젝트 기준점 값',
          description: 'Project Base Point의 동/서, 남/북, 표고 값을 선택 단위로 추출합니다. 이 값은 모델 내부의 프로젝트 기준 위치를 비교할 때 사용합니다.',
          example: '건축과 설비 RVT의 Project E/N/Z 값이 같은지 파일별 행을 나란히 비교합니다.'
        },
        {
          label: '측량 기준점과 북각',
          description: 'Survey Point 좌표와 True North 회전각을 함께 읽습니다. 좌표 단위 선택은 Survey Point에도 적용되지만 북각은 도 단위로 기록됩니다.',
          example: 'Survey E/N/Z가 같아도 True North가 15.25°와 0°로 다르면 좌표 운용 기준을 다시 확인합니다.'
        },
        {
          label: '내부 원점 공유좌표',
          description: 'Internal Origin 자체의 고정 (0, 0, 0)이 아니라 활성 Project Location에서의 공유좌표 E/N/Z를 선택 단위로 기록합니다.',
          example: '모델별 내부 원점의 공유좌표가 같은지 비교해 링크 원점과 좌표 설정 차이를 확인합니다.'
        },
        {
          label: '활성 문서와 여러 RVT',
          description: '현재 열린 모델 하나는 활성 문서 검토를, 여러 파일의 좌표를 비교할 때는 여러 RVT 검토를 사용합니다. Revit 링크 문서는 활성 문서 대상에 자동 포함되지 않습니다.',
          example: 'A-Main, S-Main, M-Main 세 파일의 기준점을 비교하려면 여러 RVT에 세 파일을 등록해 실행합니다.'
        },
        {
          label: '공통 필터 사용 여부',
          description: '기준점/북각은 문서 수준 정보를 읽으므로 객체 포함/제외 필터와 추가 객체 파라미터를 사용하지 않습니다.',
          example: '배관 카테고리 필터를 설정해도 좌표 결과는 달라지지 않으며 파일당 한 행으로 출력됩니다.'
        }
      ],
      run: [
        '좌표 출력 단위를 선택합니다.',
        '현재 모델은 활성 문서 검토, 여러 파일 비교는 여러 RVT 검토를 실행합니다.',
        '파일별 프로젝트 기준점, 측량 기준점, 내부 원점 공유좌표, 북각 값을 결과에서 비교합니다.',
        '선택한 단위가 적용된 좌표 엑셀을 저장합니다.'
      ]
    },
    linkworkset: {
      setupLead: '링크의 현재 상태만 점검할지 Workset1만 열리도록 적용할지와 동기화 기록을 정합니다.',
      settingDetails: [
        {
          label: '기본 웍셋만 자동 적용',
          description: '켜면 최상위 Revit 링크를 다시 로드할 때 기본 웍셋 Workset1만 열리도록 적용합니다. 끄면 현황 점검만 합니다.',
          example: '납품 파일에서 링크의 불필요한 사용자 웍셋을 닫으려면 켭니다.'
        },
        {
          label: '동기화 시 코멘트 적용',
          description: '워크셰어링 호스트 문서에 변경을 반영한 뒤 동기화 코멘트를 기록할지 선택합니다.',
          example: '적용 이력을 남겨야 하면 옵션을 켭니다.'
        },
        {
          label: '동기화 코멘트',
          description: '코멘트 적용을 켰을 때 중앙 모델 동기화 기록에 남길 문구입니다.',
          example: 'KKY Tools - 링크 기본 웍셋 적용을 입력합니다.'
        }
      ],
      run: [
        '점검만 할지 기본 웍셋 자동 적용까지 할지 옵션을 정합니다.',
        '활성 문서 또는 여러 RVT 검토를 실행합니다.',
        '호스트별 최상위 링크의 로드 상태와 열려 있는 사용자 웍셋을 확인합니다.',
        '자동 적용을 켠 경우 Workset1만 열리도록 다시 로드한 변경 수와 오류를 확인합니다.'
      ]
    },
    sharedparambatch: {
      setupLead: '선택한 공유파라미터마다 바인딩, 표시 그룹, 그룹 인스턴스 허용, 적용 카테고리를 따로 설정합니다.',
      settingDetails: [
        {
          label: '공유파라미터 목록',
          description: 'Revit에 연결된 공유 매개변수 TXT의 그룹과 이름을 검색해 프로젝트 파라미터로 추가할 항목을 선택합니다.',
          example: '그룹 KKY에서 KKY_LineNo와 KKY_AreaCode를 선택해 추가합니다.'
        },
        {
          label: '바인딩',
          description: '각 파라미터를 객체별 값인 인스턴스 또는 타입 공통값인 타입으로 등록합니다.',
          example: '객체마다 다른 Line No를 입력해야 하면 인스턴스를 선택합니다.'
        },
        {
          label: 'Parameter Group',
          description: 'Revit 속성 팔레트에서 프로젝트 파라미터가 표시될 그룹을 지정합니다.',
          example: '일반 관리 정보라면 Data를 선택합니다.'
        },
        {
          label: 'Values can vary by group instance',
          description: '인스턴스 바인딩 파라미터가 Revit 그룹의 각 인스턴스에서 서로 다른 값을 가질 수 있게 할지 정합니다.',
          example: '같은 모델 그룹을 복제해도 Area Code를 다르게 입력해야 하면 켭니다.'
        },
        {
          label: '적용 카테고리',
          description: '프로젝트 파라미터를 바인딩할 Revit 카테고리를 선택합니다. 전체/해제/서브카테고리 해제와 검색을 사용할 수 있습니다.',
          example: 'Pipes와 Pipe Fittings만 선택해 KKY_LineNo를 두 카테고리에 추가합니다.'
        },
        {
          label: '카테고리 프리셋',
          description: '자주 쓰는 카테고리 선택 조합을 이름 붙여 저장하고 다른 파라미터에 다시 적용합니다.',
          example: 'MEP 공통이라는 이름으로 Pipes, Ducts, Cable Trays 조합을 저장합니다.'
        },
        {
          label: '현재 설정을 전체에 적용',
          description: '선택 파라미터가 여러 개일 때 현재 파라미터의 바인딩, 그룹, 카테고리 설정을 나머지 파라미터에 복사합니다.',
          example: '세 파라미터 모두 같은 카테고리에 넣을 때 첫 설정을 만든 뒤 전체에 적용합니다.'
        },
        {
          label: 'RVT 열기와 동기화 옵션',
          description: '모든 웍셋을 닫고 열지 여부와 작업 후 동기화에 사용할 코멘트를 지정합니다.',
          example: '모든 웍셋 닫고 열기를 켜고 코멘트에 KKY 프로젝트 파라미터 추가를 입력합니다.'
        }
      ],
      run: [
        'Revit 공유 매개변수 TXT 연결 상태를 확인하고 추가할 파라미터를 선택합니다.',
        '각 파라미터의 바인딩, Parameter Group, 그룹 인스턴스 옵션, 적용 카테고리를 설정합니다.',
        '대상 RVT를 등록하고 체크한 파일과 열기/동기화 옵션을 확인한 뒤 추가 실행을 누릅니다.',
        '결과에서 추가 성공, 이미 있음, 건너뜀, 실패를 확인하고 처리 로그 엑셀을 저장합니다.'
      ]
    }
  };

  features.forEach((feature) => {
    const enhancement = manualEnhancements[feature.id];
    if (enhancement) Object.assign(feature, enhancement);
    const details = manualDetailAdditions[feature.id];
    if (details) Object.assign(feature, details);
  });

  const featureMap = new Map(features.map((item) => [item.id, item]));

  const selectableFeatureIds = new Set([
    'connector', 'unconnected', 'floorinfo', 'gridlevelconsistency', 'reducerpoint', 'familysuitability', 'tapalign', 'tapdepth',
    'dupclash', 'worksetassignment', 'parameterduplication', 'parametermissing',
    'parameterstandard', 'ghostcleaner', 'tapdepthutility', 'familylink', 'points', 'linkworkset'
  ]);

  const commonSettingsFeatureIds = new Set([
    'connector', 'unconnected', 'floorinfo', 'reducerpoint', 'familysuitability', 'tapalign', 'tapdepth',
    'dupclash', 'worksetassignment', 'parameterduplication', 'parametermissing',
    'parameterstandard', 'tapdepthutility', 'familylink', 'points', 'linkworkset'
  ]);

  const manualScreenOverrides = {
    reducerpoint: {
      base: {
        title: '고정 판정 기준과 공통 설정',
        description: 'Reducer 대상과 ECC/CON 비교 기준은 자동으로 적용되며, 공통 설정에서 검토 범위와 결과 보조 열만 조정합니다.',
        points: ['Pipe Fittings + Reducer 패밀리', 'ECC/CON 문자열 비교', 'Point 인스턴스/타입 탐색', '공통 필터와 결과 보조 열']
      }
    },
    centralworkset: {
      base: {
        title: '센트럴 생성·권한 통합 설정',
        description: '등록한 RVT의 상태를 확인하고, 같은 화면에서 센트럴 저장 경로·추가 웍셋·3D 뷰·템플릿·그리드·레벨 권한을 파일별로 정합니다.',
        points: ['경로 입력 = 새 센트럴', '경로 비움 = 기존 센트럴 권한', '3D 뷰·템플릿 권한', 'Grid/Level Pin + Owner/Editable']
      }
    },
    connector: {
      base: {
        title: '연속성 판정과 결과 열 설정',
        description: '허용 범위, 검토 파라미터와 좌표·선형 보조 열, End + Dummy 제외 여부를 설정합니다.',
        points: ['허용 범위와 단위', '검토 파라미터', '좌표·선형 정보', 'End + Dummy 패밀리 제외']
      },
      extra: [
        {
          file: 'connector-mapping.png',
          title: '파라미터 값 일치 처리 매핑',
          description: '모델에서 선택 파라미터의 고유값을 스캔하고 같은 뜻으로 볼 표기를 한 그룹으로 묶습니다.',
          points: ['매핑할 검토 파라미터', '활성 문서·여러 RVT 스캔', '현재값과 매핑값', 'Excel 양식 저장·가져오기']
        }
      ]
    },
    gridlevelconsistency: {
      base: {
        title: '좌표 기준과 통합 기준 Excel 워크플로',
        description: '좌표계를 선택하고 표준 RVT에서 통합 기준 Excel을 만들거나 기존 기준 Excel을 등록합니다.',
        points: ['Shared 또는 Internal', '활성 문서 또는 기준 RVT', '통합 기준 Excel 추출·등록', 'Grid·Level 기준 개수']
      },
      extra: [
        {
          file: 'gridlevelconsistency-options.png',
          title: '허용 오차와 결과 판정 옵션',
          description: 'mm/inch 단위, Grid 위치·방향, Level 높이 허용 오차와 이름·추가 항목 보고 여부를 설정합니다.',
          points: ['거리 단위', 'Grid 위치·방향 허용 오차', 'Level 높이 허용 오차', '이름과 추가 항목 보고']
        }
      ]
    },
    ghostcleaner: {
      base: {
        title: '자동 삭제와 선택 삭제 규칙',
        description: '항상 정리하는 명백한 유령객체와 사용자가 삭제 여부를 정하는 의심 객체를 나누어 확인합니다.',
        points: ['자동 삭제 규칙 5종', '선택 삭제 규칙 4종', '검출만 사용', '다른 검토보다 먼저 실행']
      },
      extra: [
        {
          file: 'ghostcleaner-rules.png',
          title: '선택 삭제 범위 확인',
          description: '선택 규칙을 켜면 해당 후보를 삭제합니다. 끈 규칙은 검출만 수에 반영되며 삭제되지 않은 후보는 결과 Excel에 포함되지 않습니다.',
          points: ['Opening', 'OneLevelBasedHosted FamilyInstance', '빈 Mechanical System', '빈 Piping System']
        }
      ]
    },
    deliverycleaner: {
      base: {
        title: '기본 설정과 뷰 파라미터',
        description: '결과 폴더, 정리용 3D 뷰 이름과 정리 후 뷰에 기록할 파라미터를 먼저 지정합니다.',
        points: ['정리 결과 폴더', '정리용 3D 뷰 이름', '뷰 파라미터 이름과 값']
      },
      extra: [
        {
          file: 'deliverycleaner-object-parameters.png',
          title: '객체 파라미터',
          description: '대상 객체를 찾는 조건과 조건을 통과한 객체에 쓸 값을 분리해서 입력합니다.',
          points: ['조건 결합 And/Or', '조건 파라미터·연산자·값', '입력 파라미터·새 값']
        },
        {
          file: 'deliverycleaner-view-filters.png',
          title: '뷰 필터',
          description: '정리용 3D 뷰에 적용할 Revit 필터와 최초 활성화 방식을 확인합니다.',
          points: ['필터 사용', '최초 열기 시 적용', 'XML 가져오기 또는 현재 문서 필터 추출']
        },
        {
          file: 'deliverycleaner-vg.png',
          title: 'V/G 설정',
          description: '정리용 3D 뷰의 Imported Categories 표시 상태와 패밀리 내부 Import 표시 상태를 지정합니다.',
          points: ['Show imported categories in this view', 'Imports in Families', '카테고리별 표시 요약']
        },
        {
          file: 'deliverycleaner-vg-rules.png',
          title: '카테고리와 서브카테고리 규칙',
          description: '카테고리별 표시 여부를 바꾸고 숨길 서브카테고리 이름 규칙을 추가하는 상세 창입니다.',
          points: ['카테고리 표시/숨김', '서브카테고리 Contains 규칙', '규칙 결합 방식']
        }
      ]
    },
    conditionextract: {
      base: {
        title: '필터 설정',
        description: '추출할 객체를 고르는 조건과 여러 조건의 결합 방식을 입력합니다.',
        points: ['조건 결합 And/Or', '필터 파라미터', '연산자와 비교값']
      },
      extra: [
        {
          file: 'conditionextract-extract.png',
          title: '추출 항목',
          description: '결과 열로 만들 파라미터와 좌표·선형 정보를 선택합니다.',
          points: ['쉼표로 구분한 파라미터 목록', 'X/Y/Z 좌표', '선형 방향과 길이']
        },
        {
          file: 'conditionextract-units.png',
          title: '출력 단위',
          description: '길이, 면적, 체적 값이 결과 엑셀에 표시될 단위를 지정합니다.',
          points: ['길이 단위', '면적 단위', '체적 단위']
        },
        {
          file: 'conditionextract-options.png',
          title: '추가 추출 옵션',
          description: 'End 또는 Dummy 패밀리 제외 등 결과 범위를 조정하는 보조 옵션을 설정합니다.',
          points: ['End + Dummy 제외', '선택 옵션 요약', '실행 가능 조건']
        }
      ]
    },
    dup: {
      base: {
        title: '검토 모드와 실행 화면',
        description: '중복 검토 또는 자체 간섭 모드를 선택하고 현재 적용 규칙을 확인하는 시작 화면입니다.',
        points: ['검토 모드', '현재 적용 규칙', '기본 및 세부 설정 진입']
      },
      extra: [
        {
          file: 'dup-settings-overview.png',
          title: '기본 규칙과 Set 정의',
          description: '허용 오차, 범위, 제외 키워드와 비교 대상을 묶는 Set을 구성합니다.',
          points: ['허용 오차와 단위', '전체/선택/선택 제외 범위', 'Set의 그룹 OR·조건 AND 구조']
        },
        {
          file: 'dup-settings-rules.png',
          title: '비교쌍과 제외 규칙',
          description: '자체 간섭 비교쌍, 전체 검토 제외 Set, 패밀리·시스템 제외 목록을 관리합니다.',
          points: ['Set A 대 Set B 비교쌍', '제외 Set', '패밀리/시스템 제외와 XML 설정 파일']
        }
      ]
    },
    sharedparambatch: {
      base: {
        title: '공유파라미터 선택과 대상 RVT',
        description: 'Revit에 연결된 공유 매개변수 목록에서 추가할 정의를 고르고 대상 RVT를 준비합니다.',
        points: ['공유파라미터 그룹과 검색', '선택 항목 추가', 'RVT 등록과 열기/동기화 옵션']
      },
      extra: [
        {
          file: 'sharedparambatch-editor.png',
          title: '선택 파라미터 상세 편집',
          description: '추가한 파라미터마다 바인딩, Parameter Group과 적용 카테고리를 지정합니다.',
          points: ['인스턴스/타입 바인딩', 'Parameter Group', '카테고리 트리와 프리셋']
        }
      ]
    },
    segmentpms: {
      base: {
        title: '1단계 RVT 추출',
        description: 'RVT를 등록해 Segment 정보를 추출하거나 이전 추출 결과를 불러오는 단계입니다.',
        points: ['RVT 파일 또는 폴더 등록', 'Segment 추출', '추출 결과 엑셀 저장/불러오기']
      },
      extra: [
        {
          file: 'segmentpms-compare.png',
          title: '2단계 PMS 등록과 매핑',
          description: 'PMS 기준표를 등록하고 Revit 세그먼트 그룹마다 대응 PMS 세그먼트를 선택합니다.',
          points: ['PMS 양식 추출과 등록', '매핑 준비', '추천값 확인 후 검토 시작']
        }
      ]
    },
    linksharedcoord: {
      base: {
        title: '활성 호스트와 기준 앵커',
        description: '활성 호스트에 로드된 링크, Anchor Grid 교차점, 기준 Level과 방향 기준을 선택합니다.',
        points: ['활성 Project Location', '최상위 로드 링크', 'Anchor Grid 두 개', '기준 Level과 방향 교차점']
      },
      extra: [
        {
          file: 'linksharedcoord-target.png',
          title: '목표 Shared Coordination',
          description: '링크에 저장된 Shared Site를 사용하거나 E/N/Z/Bearing 목표값을 직접 입력합니다.',
          points: ['저장 Shared Site', '직접 입력', 'mm/m 단위', 'Bearing CW+']
        },
        {
          file: 'linksharedcoord-analysis.png',
          title: '분석 결과와 반영 단계',
          description: '현재값, 목표값과 차이를 확인한 뒤 호스트 배치 적용과 Publish를 각각 실행합니다.',
          points: ['현재·목표·차이', '분석 경고', '호스트 링크 배치 적용', 'Publish 확인과 링크 저장']
        }
      ]
    }
  };

  const excelInputVisuals = {
    gridlevelconsistency: {
      title: 'Level 기준 입력표',
      description: 'Levels 시트에 사용할 Level 이름과 표고를 작성합니다. 사용 열이 꺼진 행과 빈 행은 기준에서 제외됩니다.',
      points: ['사용 여부', '레벨명', '선택 단위의 표고', '_Levels예시 시트 참고']
    },
    familysuitability: {
      title: '승인 패밀리 타입 기준표',
      description: 'Category, Family, Type 열에 승인할 조합을 한 행씩 입력합니다. 헤더는 한글 또는 영문 인식 이름을 사용합니다.',
      points: ['한 행은 하나의 승인 조합', '열 순서는 달라도 헤더 이름은 유지', '빈 행과 설명 행은 기준에서 제외']
    },
    parameterstandard: {
      title: '속성 기준값 입력표',
      description: '비교할 파라미터, 공란 허용 여부와 허용값을 기준 시트에 작성합니다.',
      points: ['Parameter Name', 'Allow Blank의 Y/N', 'Allowed Value를 행 단위로 입력']
    },
    segmentpms: {
      title: 'PMS 세그먼트 기준표',
      description: 'PMS Segment와 OD/ID 등 비교 기준값을 샘플 양식의 헤더 아래에 입력합니다.',
      points: ['PMS Segment는 매핑 키', 'OD/ID는 같은 단위로 작성', 'Service/Material은 식별 보조값']
    },
    linkpath: {
      title: '링크 경로 적용 기준표',
      description: '추출된 기존 링크는 기본 Action=유지입니다. Action을 명시한 행에서만 Reload From, 신규 링크, 삭제를 실행하며 노란색 입력 열만 수정합니다.',
      points: ['유지=변경 없음, 빈 경로도 삭제 아님', 'Reload From/신규 링크는 TargetLinkPath 필수', '삭제는 Action=삭제 + 대상 경로 비움', '식별·현재 상태 열은 그대로 유지']
    },
    lateralnozzle: {
      title: 'KTA 원본 헤더 블록',
      description: '각 시트에 UT명, 배관No, Nozzle Code, No 헤더가 있어야 자동으로 검사 범위를 찾습니다.',
      points: ['헤더 이름을 정확히 유지', 'No는 숫자로 입력 가능', '여러 시트의 동일 블록을 모두 검색']
    },
    guid: {
      title: 'GUID 삭제용 작업표',
      description: '검토 결과로 만든 삭제용 엑셀에서 실제 삭제할 행의 Delete/삭제여부 열만 수정합니다.',
      points: ['삭제 대상 행에 삭제 입력', 'GUID와 HiddenKey는 수정하지 않음', '빈 Delete 셀은 유지 대상']
    },
    centralworkset: {
      title: '센트럴·권한 Excel 2.0 설정표',
      description: '보이는 헤더를 간단한 한글로 정리한 작업표입니다. 센트럴 저장 경로 입력 여부로 새 센트럴 생성과 기존 센트럴 권한 적용을 자동 구분합니다.',
      points: ['실행 여부 · 원본 RVT · 기존 웍셋', '센트럴 저장 경로 (비우면 권한만 적용)', '추가 웍셋 1~N', '3D 뷰 권한 · 이름', '3D 뷰 템플릿 권한 · 이름', '그리드·레벨 핀 + 웍셋 권한']
    },
    linksharedcoord: {
      title: 'Link Shared Coordination 검토표',
      description: '링크별 현재 SITE와 배치 상태를 읽고, 필요한 행만 Action을 APPLY로 지정해 다시 불러오는 작업표입니다.',
      points: ['Action은 REVIEW/APPLY/SKIP', 'Shared Site와 Active Site를 분리 확인', '현재 배치는 추정값으로 표시', '숨김 식별 열은 수정하지 않음']
    }
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function appendList(parent, items, className) {
    const list = el('ul', className || 'manual-list');
    (items || []).forEach((item) => list.append(el('li', '', item)));
    parent.append(list);
  }

  function featureHref(id) {
    return `/Manual/features/${id}.html`;
  }

  function renderFeatureIndex() {
    const mount = document.querySelector('[data-feature-index]');
    if (!mount) return;

    const groups = ['BQC 검토', '유틸리티'];
    groups.forEach((group) => {
      const section = el('section', 'section');
      const header = el('div', 'section-header');
      const text = el('div');
      text.append(el('span', 'eyebrow', group === 'BQC 검토' ? 'QUALITY CONTROL' : 'GENERAL TOOLS'));
      text.append(el('h2', '', group === 'BQC 검토' ? 'BQC 검토 기능' : '유틸리티 기능'));
      text.append(el('p', '', group === 'BQC 검토'
        ? '납품 검토 과정에서 여러 기능을 선택해 같은 대상에 적용합니다.'
        : '반복 작업과 운영 도구를 단독 또는 배치 흐름으로 실행합니다.'));
      header.append(text);

      const list = el('div', 'feature-list feature-list--linked');
      features.filter((item) => item.group === group).forEach((item) => {
        const link = el('a', 'feature-row feature-row--link');
        link.href = featureHref(item.id);
        const body = el('div');
        const title = el('h3', '', item.title);
        const desc = el('p', '', item.summary);
        const meta = el('div', 'feature-row__meta');
        meta.append(el('span', 'mini-chip', item.target));
        body.append(title, desc, meta);
        link.append(body, el('span', `badge ${item.badge === '배치 선택' ? 'ok' : item.badge.includes('필요') || item.badge.includes('엑셀') || item.badge.includes('영역') || item.badge.includes('기준') ? 'warn' : 'blue'}`, item.badge), el('span', 'feature-row__arrow', '상세 보기'));
        list.append(link);
      });

      section.append(header, list);
      mount.append(section);
    });
  }

  function renderExportRows(feature) {
    const tbody = document.createElement('tbody');
    const cases = feature.export && feature.export.multi ? [
      ['한글 + 한 파일', feature.export.single, '한글 헤더와 한글 판정 문구로 하나의 xlsx에 저장합니다. 여러 RVT는 파일별 시트로 묶입니다.'],
      ['영문 + 한 파일', feature.export.single, '영문 헤더와 영문 판정 문구로 하나의 xlsx에 저장합니다. 기본 파일명은 동일합니다.'],
      ['한글 + 파일별', `{RVT파일명}_${feature.export.splitKo}_00EA.xlsx`, '선택한 폴더에 RVT 파일별로 따로 저장합니다.'],
      ['영문 + 파일별', `{RVT파일명}_${feature.export.splitEn || feature.export.splitKo}_00EA.xlsx`, '영문 기능명과 영문 헤더를 사용해 RVT 파일별로 저장합니다.']
    ] : [
      ['한글 + 한 파일', feature.export?.single || '사용자가 저장 위치와 파일명을 선택합니다.', '한글 헤더와 한글 판정 문구로 저장합니다.'],
      ['영문 + 한 파일', feature.export?.single || '사용자가 저장 위치와 파일명을 선택합니다.', '지원되는 기능은 영문 헤더와 문구로 저장합니다.'],
      ['한글 + 파일별', '지원하지 않음', feature.export?.note || '단독 화면 기능은 공통 파일별 저장 옵션을 사용하지 않습니다.'],
      ['영문 + 파일별', '지원하지 않음', feature.export?.note || '단독 화면 기능은 공통 파일별 저장 옵션을 사용하지 않습니다.']
    ];

    cases.forEach((row) => {
      const tr = document.createElement('tr');
      row.forEach((cell) => tr.append(el('td', '', cell)));
      tbody.append(tr);
    });
    return tbody;
  }

  function addManualCard(parent, title, content, options) {
    const card = el('section', `manual-card${options?.accent ? ' manual-card--accent' : ''}`);
    card.append(el('h2', '', title));
    if (typeof content === 'string') {
      card.append(el('p', '', content));
    } else if (Array.isArray(content)) {
      appendList(card, content, options?.className || 'manual-list');
    } else if (content) {
      card.append(content);
    }
    parent.append(card);
    return card;
  }

  function appendSettingDetails(parent, feature) {
    const items = Array.isArray(feature.settingDetails) ? feature.settingDetails : [];
    if (!items.length) {
      appendList(parent, feature.setup, 'manual-list');
      return;
    }

    if (feature.setupLead) {
      parent.append(el('p', 'manual-card__intro', feature.setupLead));
    }

    const list = el('div', 'manual-setting-list');
    items.forEach((item, index) => {
      const row = el('div', 'manual-setting-row');
      const label = el('div', 'manual-setting-label');
      label.append(
        el('span', 'manual-setting-index', String(index + 1).padStart(2, '0')),
        el('h3', '', item.label)
      );

      const copy = el('div', 'manual-setting-copy');
      copy.append(el('p', 'manual-setting-description', item.description));
      if (item.example) {
        const example = el('p', 'manual-setting-example');
        example.append(el('strong', '', '예시'), document.createTextNode(item.example));
        copy.append(example);
      }

      row.append(label, copy);
      list.append(row);
    });
    parent.append(list);
  }

  function getSetupScreens(feature) {
    const override = manualScreenOverrides[feature.id] || {};
    const defaultPoints = (feature.settingDetails || []).slice(0, 4).map((item) => item.label);
    const screens = [{
      file: `${feature.id}.png`,
      title: override.base?.title || '기능 설정 화면',
      description: override.base?.description || '기능별 필수 설정과 현재 설정 상태를 한 화면에서 확인합니다.',
      points: override.base?.points || defaultPoints
    }];

    if (commonSettingsFeatureIds.has(feature.id)) {
      screens.push({
        file: 'workflow-common-settings.png',
        title: '공통 설정',
        description: '공통 설정 수정을 누르면 검토 대상 필터, 제외 필터와 결과에 함께 넣을 추가 파라미터를 설정할 수 있습니다.',
        points: ['추가 결과 파라미터', '포함 필터', '제외 필터', '설정 적용 후 기능별 설정으로 복귀']
      });
    }

    (override.extra || []).forEach((item) => screens.push(item));
    return screens;
  }

  function createManualVisual(item, index, kind) {
    const figure = el('figure', `manual-visual manual-visual--${kind || 'screen'}`);
    const header = el('div', 'manual-visual__header');
    const heading = el('div', 'manual-visual__heading');
    heading.append(
      el('span', 'manual-visual__step', `${kind === 'excel' ? 'EXCEL' : '화면'} ${String(index + 1).padStart(2, '0')}`),
      el('h3', '', item.title)
    );
    header.append(heading, el('span', 'manual-visual__open', '원본 보기'));

    const link = el('a', 'manual-visual__link');
    link.href = item.src;
    link.target = '_blank';
    link.rel = 'noopener';
    link.setAttribute('aria-label', `${item.title} 원본 이미지 열기`);

    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.alt || `${item.title} 화면 예시`;
    img.loading = 'lazy';
    link.append(img);

    const caption = el('figcaption', 'manual-visual__caption');
    caption.append(el('p', '', item.description || '이미지를 누르면 원본 크기로 확인할 수 있습니다.'));
    if (item.points && item.points.length) {
      const callouts = el('ul', 'manual-visual__points');
      item.points.forEach((point) => callouts.append(el('li', '', point)));
      caption.append(callouts);
    }

    figure.append(header, link, caption);
    return figure;
  }

  function appendSetupScreenshots(parent, feature) {
    const intro = el('div', 'manual-visual-section-head');
    intro.append(
      el('h3', '', '화면을 보면서 설정하기'),
      el('p', '', '아래 이미지는 실제 KKY Tool 3.0 화면을 같은 순서로 캡처한 것입니다. 각 이미지를 누르면 글자를 읽을 수 있는 원본 크기로 열립니다.')
    );
    const gallery = el('div', 'manual-visual-gallery manual-visual-gallery--screens');
    getSetupScreens(feature).forEach((screen, index) => {
      gallery.append(createManualVisual({
        ...screen,
        src: `/assets/manual-screenshots/${screen.file}?v=${staticAssetVersion}`,
        alt: `${feature.title} - ${screen.title}`
      }, index, 'screen'));
    });
    parent.append(intro, gallery);
  }

  function appendExcelVisuals(parent, feature) {
    const visuals = [];
    const input = excelInputVisuals[feature.id];
    if (input) {
      visuals.push({
        ...input,
        src: `/assets/manual-excel/${feature.id}-input.png?v=${staticAssetVersion}`,
        alt: `${feature.title} 입력 엑셀 구조 예시`
      });
    }
    if (feature.excelOutputVisuals !== false) {
      visuals.push({
        title: `${feature.title} 결과표`,
        description: '결과 엑셀의 핵심 열과 값 배치를 보여주는 구조 예시입니다. 실제 열은 선택한 추가 파라미터, 단위 옵션과 Revit 데이터에 따라 더 늘어날 수 있습니다.',
        points: (feature.result || []).slice(0, 3),
        src: `/assets/manual-excel/${feature.id}-result.png?v=${staticAssetVersion}`,
        alt: `${feature.title} 결과 엑셀 구조 예시`
      });
    }

    const intro = el('div', 'manual-visual-section-head manual-visual-section-head--excel');
    intro.append(
      el('h3', '', input ? '입력 양식과 결과 엑셀 보기' : '결과 엑셀 보기'),
      el('p', '', '표 구조를 먼저 확인한 뒤 실제 파일을 작성하거나 결과를 읽어야 열 이름과 입력 위치를 혼동하지 않습니다. 노란 셀은 사용자가 입력하거나 수정하는 열입니다.')
    );
    const gallery = el('div', 'manual-visual-gallery manual-visual-gallery--excel');
    visuals.forEach((visual, index) => gallery.append(createManualVisual(visual, index, 'excel')));
    parent.append(intro, gallery);
  }

  function renderFeatureDetail() {
    const mount = document.querySelector('[data-feature-detail]');
    if (!mount) return;

    const id = document.body.dataset.featureId;
    const feature = featureMap.get(id);
    if (!feature) {
      mount.append(el('p', 'lead', '존재하지 않는 기능 페이지입니다.'));
      return;
    }

    document.title = `${feature.title} | KKY Tool 기능 매뉴얼`;

    const breadcrumb = el('div', 'breadcrumb');
    const back = el('a', '', 'KKY Tool 매뉴얼');
    back.href = '/Manual/kky-tool.html';
    breadcrumb.append(back, el('span', '', '/'), el('span', '', feature.title));

    const hero = el('section', 'manual-hero');
    const heroText = el('div');
    heroText.append(el('span', 'eyebrow', feature.group));
    heroText.append(el('h1', '', feature.title));
    heroText.append(el('p', 'lead', feature.summary));
    const actions = el('div', 'actions');
    const listLink = el('a', 'button secondary', 'KKY Tool 매뉴얼로');
    listLink.href = '/Manual/kky-tool.html';
    const manualLink = el('a', 'button', '다른 프로그램 선택');
    manualLink.href = '/Manual/index.html';
    actions.append(listLink, manualLink);
    heroText.append(actions);

    const facts = el('div', 'manual-facts');
    [
      ['분류', feature.group],
      ['실행 방식', feature.badge],
      ['대상', feature.target]
    ].forEach(([label, value]) => {
      const item = el('div', 'manual-fact');
      item.append(el('span', '', label), el('strong', '', value));
      facts.append(item);
    });
    hero.append(heroText, facts);

    const layout = el('div', 'feature-manual-layout');
    const main = el('div', 'feature-manual-main');
    const side = el('aside', 'feature-manual-side');

    addManualCard(main, '사용자 설명', feature.userGuide || `${feature.title}은 ${feature.summary} 설정을 끝낸 뒤 대상 문서를 선택하고 실행하면 결과와 엑셀을 확인하는 흐름입니다.`, { accent: true });
    const setupCard = addManualCard(main, '설정 방법', null);
    appendSettingDetails(setupCard, feature);
    appendSetupScreenshots(setupCard, feature);
    addManualCard(main, '실행 방법', feature.run);
    addManualCard(main, '검토 논리', feature.logic, { className: 'manual-list manual-list--logic' });
    addManualCard(main, '결과 확인', feature.result);

    if (feature.export?.workflow) {
      const exportCard = addManualCard(main, feature.export.title || '검토 Excel', feature.export.steps || []);
      if (feature.export.note) exportCard.append(el('p', 'manual-note', feature.export.note));
      if (feature.excelVisuals !== false) appendExcelVisuals(exportCard, feature);
    } else if (feature.export?.available === false) {
      const exportCard = addManualCard(main, feature.export.title || '엑셀 추출', feature.export.note || '이 기능은 Excel 결과를 생성하지 않습니다.');
      if (feature.excelVisuals !== false) appendExcelVisuals(exportCard, feature);
    } else {
      const exportWrap = el('div', 'table-wrap');
      const table = document.createElement('table');
      table.className = 'export-table';
      const thead = document.createElement('thead');
      const tr = document.createElement('tr');
      ['선택 조합', '파일명 또는 저장 방식', '설명'].forEach((head) => tr.append(el('th', '', head)));
      thead.append(tr);
      table.append(thead, renderExportRows(feature));
      exportWrap.append(table);
      const exportCard = addManualCard(main, '엑셀 추출', exportWrap);
      if (feature.export?.note) exportCard.append(el('p', 'manual-note', feature.export.note));
      if (feature.export?.multi) exportCard.append(el('p', 'manual-note', multiExportNote));
      if (feature.excelVisuals !== false) appendExcelVisuals(exportCard, feature);
    }

    if (feature.notes && feature.notes.length) {
      addManualCard(main, '주의할 점', feature.notes, { className: 'manual-list manual-list--notice' });
    }

    const navCard = el('section', 'manual-card');
    navCard.append(el('h2', '', '같은 분류 기능'));
    const navList = el('div', 'detail-nav');
    features.filter((item) => item.group === feature.group).forEach((item) => {
      const link = el('a', item.id === feature.id ? 'is-current' : '');
      link.href = featureHref(item.id);
      link.textContent = item.title;
      navList.append(link);
    });
    navCard.append(navList);

    const exportCardSide = el('section', 'manual-card manual-card--compact');
    exportCardSide.append(el('h2', '', '파일명 핵심'));
    appendList(exportCardSide, feature.export?.available === false
      ? ['Excel 출력 없음', feature.export.note || '화면에서 결과를 확인합니다.']
      : feature.export?.multi
        ? [
            `한 파일: ${feature.export.single}`,
            `파일별 한글: {RVT파일명}_${feature.export.splitKo}_00EA.xlsx`,
            `파일별 영문: {RVT파일명}_${feature.export.splitEn || feature.export.splitKo}_00EA.xlsx`
          ]
        : [
            feature.export?.single || '사용자가 저장 위치와 파일명을 선택합니다.',
            '공통 파일별 저장 옵션 없음'
          ]);

    side.append(navCard, exportCardSide);
    layout.append(main, side);

    mount.append(breadcrumb, hero, layout);
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderFeatureIndex();
    renderFeatureDetail();
  });

  window.KKY_FEATURE_MANUALS = {
    features,
    getFeature: (id) => featureMap.get(id) || null
  };
}());
