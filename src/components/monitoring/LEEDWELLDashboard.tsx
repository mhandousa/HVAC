import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Leaf,
  Award,
  Target,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  FileText,
  Plus,
} from 'lucide-react';
import { 
  useCertificationProjects, 
  useCertificationSummary,
  CertificationProject 
} from '@/hooks/useCertificationTracking';
import { CertificationCreditCard } from './CertificationCreditCard';
import { CertificationScoreGauge } from './CertificationScoreGauge';
import { useTranslation } from 'react-i18next';

interface LEEDWELLDashboardProps {
  projectId?: string;
}

const CERTIFICATION_TYPES = {
  'leed_v4': { name: 'LEED v4', icon: Leaf, color: 'text-green-500' },
  'leed_v4.1': { name: 'LEED v4.1', icon: Leaf, color: 'text-green-500' },
  'well_v2': { name: 'WELL v2', icon: Award, color: 'text-blue-500' },
  'mostadam': { name: 'Mostadam', icon: Target, color: 'text-amber-500' },
  'estidama': { name: 'Estidama', icon: Target, color: 'text-teal-500' },
};

export function LEEDWELLDashboard({ projectId }: LEEDWELLDashboardProps) {
  const { t } = useTranslation();
  const { certificationProjects, isLoading, createCertificationProject } = useCertificationProjects(projectId);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const selectedProject = certificationProjects?.find(p => p.id === selectedProjectId) || certificationProjects?.[0];
  const summary = useCertificationSummary(selectedProject);

  const handleCreateProject = async (type: string) => {
    await createCertificationProject.mutateAsync({
      project_id: projectId || null,
      certification_type: type as CertificationProject['certification_type'],
      status: 'registered',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!certificationProjects || certificationProjects.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="flex justify-center gap-4 mb-6">
              <Leaf className="h-12 w-12 text-green-500 opacity-50" />
              <Award className="h-12 w-12 text-blue-500 opacity-50" />
              <Target className="h-12 w-12 text-amber-500 opacity-50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('No Certification Projects')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('Start tracking LEED, WELL, or Mostadam certification for this project')}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {Object.entries(CERTIFICATION_TYPES).map(([key, type]) => (
                <Button
                  key={key}
                  variant="outline"
                  onClick={() => handleCreateProject(key)}
                  disabled={createCertificationProject.isPending}
                >
                  <type.icon className={`h-4 w-4 mr-2 ${type.color}`} />
                  {type.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const certType = selectedProject?.certification_type 
    ? CERTIFICATION_TYPES[selectedProject.certification_type as keyof typeof CERTIFICATION_TYPES]
    : null;

  return (
    <div className="space-y-6">
      {/* Header with Project Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {certificationProjects.length > 1 ? (
            <Select
              value={selectedProject?.id}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select certification" />
              </SelectTrigger>
              <SelectContent>
                {certificationProjects.map(project => {
                  const type = CERTIFICATION_TYPES[project.certification_type as keyof typeof CERTIFICATION_TYPES];
                  return (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        {type && <type.icon className={`h-4 w-4 ${type.color}`} />}
                        {type?.name || project.certification_type}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center gap-2">
              {certType && <certType.icon className={`h-5 w-5 ${certType.color}`} />}
              <h2 className="text-lg font-semibold">{certType?.name} Certification</h2>
            </div>
          )}
          <Badge variant={
            selectedProject?.status === 'achieved' ? 'default' :
            selectedProject?.status === 'in_progress' ? 'secondary' :
            'outline'
          }>
            {selectedProject?.status === 'achieved' && <CheckCircle className="h-3 w-3 mr-1" />}
            {selectedProject?.status === 'in_progress' && <Clock className="h-3 w-3 mr-1" />}
            {selectedProject?.status}
          </Badge>
        </div>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          {t('Export Report')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <CertificationScoreGauge 
              achieved={summary.achievedPoints}
              target={summary.targetPoints}
              total={summary.totalPoints}
              currentLevel={summary.currentLevel}
              targetLevel={summary.targetLevel}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{summary.overallCompliance}%</div>
              <div className="text-sm text-muted-foreground mb-2">{t('Overall Compliance')}</div>
              <Progress value={summary.overallCompliance} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 text-center">
              <div>
                <div className="text-lg font-semibold">{summary.pursuingCredits}</div>
                <div className="text-xs text-muted-foreground">{t('Pursuing')}</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">{summary.achievedCredits}</div>
                <div className="text-xs text-muted-foreground">{t('Achieved')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">{t('IEQ Points')}</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">{t('Achieved')}</span>
                <span className="font-semibold">{summary.achievedPoints} pts</span>
              </div>
              <Progress 
                value={(summary.achievedPoints / summary.totalPoints) * 100} 
                className="h-2"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('Target')}: {summary.targetPoints} pts</span>
                <span>{t('Max')}: {summary.totalPoints} pts</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">{t('Certification Level')}</span>
              <Award className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-center">
              <Badge 
                variant="outline" 
                className={`text-lg py-1 px-3 ${
                  summary.currentLevel.includes('Platinum') ? 'border-gray-400 text-gray-600' :
                  summary.currentLevel.includes('Gold') ? 'border-yellow-500 text-yellow-600' :
                  summary.currentLevel.includes('Silver') ? 'border-gray-400 text-gray-500' :
                  summary.currentLevel.includes('Bronze') ? 'border-orange-500 text-orange-600' :
                  'border-muted text-muted-foreground'
                }`}
              >
                {summary.currentLevel}
              </Badge>
              {summary.targetLevel !== summary.currentLevel && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {t('Target')}: {summary.targetLevel}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credits Tabs */}
      {selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('IEQ Credits & Features')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">{t('All')}</TabsTrigger>
                <TabsTrigger value="pursuing">{t('Pursuing')}</TabsTrigger>
                <TabsTrigger value="achieved">{t('Achieved')}</TabsTrigger>
                <TabsTrigger value="at_risk">{t('At Risk')}</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <ScrollArea className="h-[400px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedProject.credits?.map(credit => (
                      <CertificationCreditCard
                        key={credit.id}
                        credit={credit}
                        certificationType={selectedProject.certification_type}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="pursuing" className="mt-4">
                <ScrollArea className="h-[400px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedProject.credits
                      ?.filter(c => c.status === 'pursuing' || c.status === 'documented')
                      .map(credit => (
                        <CertificationCreditCard
                          key={credit.id}
                          credit={credit}
                          certificationType={selectedProject.certification_type}
                        />
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="achieved" className="mt-4">
                <ScrollArea className="h-[400px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedProject.credits
                      ?.filter(c => c.status === 'achieved')
                      .map(credit => (
                        <CertificationCreditCard
                          key={credit.id}
                          credit={credit}
                          certificationType={selectedProject.certification_type}
                        />
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="at_risk" className="mt-4">
                <ScrollArea className="h-[400px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedProject.credits
                      ?.filter(c => c.status === 'pursuing' && (c.compliance_percentage || 0) < 90)
                      .map(credit => (
                        <CertificationCreditCard
                          key={credit.id}
                          credit={credit}
                          certificationType={selectedProject.certification_type}
                          showAlert
                        />
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
