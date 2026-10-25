import React from 'react';
import { DedsOrbitAnimation } from './DedsOrbitAnimation';

interface KnowledgeRocketEarthAnimationProps {
  className?: string;
  onExploreCourses?: () => void;
}

export const KnowledgeRocketEarthAnimation: React.FC<KnowledgeRocketEarthAnimationProps> = ({
  className = '',
  onExploreCourses,
}) => {
  return (
    <DedsOrbitAnimation
      className={className}
      onExploreCourses={onExploreCourses}
    />
  );
};
