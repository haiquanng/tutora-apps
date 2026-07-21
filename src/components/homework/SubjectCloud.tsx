import { IconCloud } from '../ui/IconCloud';

const CLOUD_ICONS = [
  '/icons/math.png',
  '/icons/geometry.png',
  '/icons/vertex.png',
  '/icons/physical.png',
  '/icons/chemical.png',
  '/icons/biology.png',
  '/icons/literature.png',
  '/icons/eng.png',
  '/icons/history.png',
  '/icons/geography.png',
  '/icons/statistics.png',
  '/icons/other.png',
];

export const SubjectCloud = () => (
  <div className="flex justify-center">
    <IconCloud images={CLOUD_ICONS} size={220} showControl={false} />
  </div>
);
