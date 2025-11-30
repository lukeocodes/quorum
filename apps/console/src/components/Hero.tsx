import React from 'react';
import { Button, Badge } from '@quorum/app';

interface HeroProps {
  onDownload?: () => void;
  onLearnMore?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onDownload, onLearnMore }) => {
  return (
    <div className="text-center">
      <Badge variant="primary" size="md">
        v0.1.0 - Beta
      </Badge>
      <h1 className="mt-6 text-6xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
        Welcome to Quorum
      </h1>
      <p className="text-xl text-text-secondary mb-8">
        A Slack-like app for discussions between humans and AIs
      </p>
      <div className="flex gap-4 justify-center">
        <Button variant="primary" size="lg" onClick={onLearnMore}>
          Learn More
        </Button>
        <Button variant="ghost" size="lg" onClick={onDownload}>
          Download
        </Button>
      </div>
    </div>
  );
};

