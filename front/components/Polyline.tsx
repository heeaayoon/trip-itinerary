"use client";

import { forwardRef, useContext, useEffect, useImperativeHandle, useMemo, useRef, Ref } from 'react';
import { GoogleMapsContext, useMapsLibrary } from '@vis.gl/react-google-maps';

type PolylineProps = google.maps.PolylineOptions;

type PolylineRef = Ref<google.maps.Polyline | null>;

function usePolyline(props: PolylineProps) {
  const { map } = useContext(GoogleMapsContext)!;

  const polyline = useMemo(() => {
    // google.maps.Polyline 인스턴스 생성
    return new google.maps.Polyline(props);
  }, []);

  // 맵 인스턴스에 Polyline 연결
  useEffect(() => {
    if (!map) return;
    polyline.setMap(map);

    return () => {
      polyline.setMap(null);
    };
  }, [map, polyline]);

  // props가 바뀔 때마다 옵션 업데이트
  useEffect(() => {
    polyline.setOptions(props);
  }, [polyline, props]);

  return polyline;
}

export const Polyline = forwardRef((props: PolylineProps, ref: PolylineRef) => {
  const polyline = usePolyline(props);

  useImperativeHandle(ref, () => polyline, [polyline]);

  return null;
});