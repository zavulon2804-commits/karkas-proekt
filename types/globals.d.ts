// Глобальные библиотеки, которые подключаются через <script>.
import * as _THREE from 'three';
declare global {
  const THREE: typeof _THREE;
  const JSZip: any;
  const XLSX: any;
  interface Window { claude?: any; JSZip?: any; XLSX?: any; [k: string]: any }
}
export {};
