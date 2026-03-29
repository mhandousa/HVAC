import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DesignWorkflowWizard } from '@/components/design/DesignWorkflowWizard';
import { useProjects } from '@/hooks/useProjects';
import { Loader2 } from 'lucide-react';

export default function DesignWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  const [isOpen, setIsOpen] = useState(true);
  
  const { data: projects, isLoading } = useProjects();

  // If no project specified, redirect to Design page
  useEffect(() => {
    if (!isLoading && !projectId && projects?.length) {
      // Use first project as default
      navigate(`/design/wizard?project=${projects[0].id}`, { replace: true });
    }
  }, [projectId, projects, isLoading, navigate]);

  const handleClose = () => {
    setIsOpen(false);
    // Navigate back to design tools
    if (projectId) {
      navigate(`/design?project=${projectId}`);
    } else {
      navigate('/design');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No project selected</p>
      </div>
    );
  }

  return (
    <DesignWorkflowWizard
      projectId={projectId}
      isOpen={isOpen}
      onClose={handleClose}
    />
  );
}
