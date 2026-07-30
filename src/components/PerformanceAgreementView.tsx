import React, { useState, useMemo } from 'react';
import { 
  Target, 
  GitFork, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  FileText, 
  Award, 
  TrendingUp, 
  ChevronRight, 
  ChevronDown, 
  User, 
  Building, 
  Users, 
  Layers, 
  Bookmark, 
  ShieldCheck, 
  ClipboardCheck, 
  FileCheck,
  Send,
  Printer,
  ArrowUp,
  ArrowDown,
  Edit2,
  Sparkles,
  Brain,
  BookOpen,
  Copy,
  Calculator,
  Table,
  Save,
  RotateCcw
} from 'lucide-react';
import { Employee, InstitutionalIdentity, PerformanceAgreement, PerformanceIndicator, AppSettings, CriticalNotification, NewsReport, CooperationContract, ReporterTarget, IndicatorComment } from '../types';
import SignaturePad from './SignaturePad';
import IndicatorCommentsSection from './IndicatorCommentsSection';

// Helper to calculate indicator achievement percentage score based on periodType
const getIndicatorScore = (obj: PerformanceIndicator) => {
  if (!obj) return 0;
  const periodType = obj.periodType || 'tahunan';
  const targetVal = parseFloat(obj.target) || 100;
  
  const trajectory = obj.trajectory && obj.trajectory.length === 12 
    ? obj.trajectory 
    : Array(12).fill(targetVal / 12);
  const achievements = obj.monthlyAchievements && obj.monthlyAchievements.length === 12
    ? obj.monthlyAchievements
    : Array(12).fill(0);

  const tType = obj.trajectoryType || (
    obj.unit === '%' || 
    obj.indicatorName.toLowerCase().includes('ikpa') || 
    obj.indicatorName.toLowerCase().includes('nilai') 
      ? 'constant' 
      : 'cumulative'
  );

  if (periodType === 'triwulanan') {
    const qScores: number[] = [];
    for (let q = 0; q < 4; q++) {
      const startIndex = q * 3;
      const qTarget = tType === 'constant'
        ? (trajectory[startIndex] + trajectory[startIndex+1] + trajectory[startIndex+2]) / 3
        : (trajectory[startIndex] + trajectory[startIndex+1] + trajectory[startIndex+2]);
      
      const qReal = tType === 'constant'
        ? (achievements[startIndex] + achievements[startIndex+1] + achievements[startIndex+2]) / 3
        : (achievements[startIndex] + achievements[startIndex+1] + achievements[startIndex+2]);

      let effectiveQTarget = qTarget;
      if (effectiveQTarget <= 0) {
        effectiveQTarget = tType === 'constant' ? targetVal : targetVal / 4;
      }

      const qScore = effectiveQTarget > 0 ? (qReal / effectiveQTarget) * 100 : 0;
      qScores.push(Math.min(120, Math.max(0, qScore)));
    }
    return Math.round(qScores.reduce((sum, s) => sum + s, 0) / 4);
  } else if (periodType === 'semesteran') {
    const sScores: number[] = [];
    for (let s = 0; s < 2; s++) {
      const startIndex = s * 6;
      let sTarget = 0;
      let sReal = 0;
      for (let i = 0; i < 6; i++) {
        sTarget += trajectory[startIndex + i];
        sReal += achievements[startIndex + i];
      }
      if (tType === 'constant') {
        sTarget = sTarget / 6;
        sReal = sReal / 6;
      }

      let effectiveSTarget = sTarget;
      if (effectiveSTarget <= 0) {
        effectiveSTarget = tType === 'constant' ? targetVal : targetVal / 2;
      }

      const sScore = effectiveSTarget > 0 ? (sReal / effectiveSTarget) * 100 : 0;
      sScores.push(Math.min(120, Math.max(0, sScore)));
    }
    return Math.round(sScores.reduce((sum, s) => sum + s, 0) / 2);
  } else {
    // Cast to any to safely access temporary mapped fields _scaledTargetVal
    const anyObj = obj as any;
    const tVal = anyObj._scaledTargetVal !== undefined ? anyObj._scaledTargetVal : targetVal;
    const real = obj.achievement || 0;
    return tVal > 0 ? Math.min(120, Math.round((real / tVal) * 100)) : 0;
  }
};

interface PerformanceAgreementViewProps {
  employees: Employee[];
  identity: InstitutionalIdentity;
  settings: AppSettings;
  agreements: PerformanceAgreement[];
  onUpdateAgreements: (agreements: PerformanceAgreement[]) => void;
  onAddNotification?: (notification: CriticalNotification) => void;
  currentUser?: { id: string; name: string; role: 'Kepala' | 'Staff' | 'Ketua Bidang' | 'Superadmin'; division?: string; photo?: string } | null;
  newsReports?: NewsReport[];
  contracts?: CooperationContract[];
  reporterTargets?: ReporterTarget[];
}

export default function PerformanceAgreementView({
  employees,
  identity,
  settings,
  agreements,
  onUpdateAgreements,
  onAddNotification,
  currentUser,
  newsReports = [],
  contracts = [],
  reporterTargets = []
}: PerformanceAgreementViewProps) {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [activeTab, setActiveTab] = useState<'pohon' | 'evaluasi'>('pohon');

  // Helper to check edit permissions for a specific agreement level
  const canEditAgreement = (agreementLevel: string) => {
    if (!currentUser) return true;
    
    // Kepala & Superadmin can edit all levels (1, 2, 3)
    if (currentUser.role === 'Kepala' || currentUser.role === 'Superadmin') {
      return true;
    }
    
    // Level 3 is 'Pegawai'
    // Level 3 can be edited by level 2 (Ketua Bidang)
    if (agreementLevel === 'Pegawai' && currentUser.role === 'Ketua Bidang') {
      return true;
    }
    
    return false;
  };
  
  // For inline indicator addition
  const [editingAgreementId, setEditingAgreementId] = useState<string | null>(null);
  const [newIndicatorName, setNewIndicatorName] = useState('');
  const [newIndicatorTarget, setNewIndicatorTarget] = useState('');
  const [newIndicatorUnit, setNewIndicatorUnit] = useState('%');
  const [newIndicatorWeight, setNewIndicatorWeight] = useState(25);

  // For delegation modal / state
  const [delegatingIndicator, setDelegatingIndicator] = useState<{
    indicator: PerformanceIndicator;
    sourceAgreement: PerformanceAgreement;
  } | null>(null);
  
  const [delegateLevel, setDelegateLevel] = useState<string>('');
  const [delegateEmployeeId, setDelegateEmployeeId] = useState<string>('');
  const [delegatedIndicatorName, setDelegatedIndicatorName] = useState('');
  const [delegatedTarget, setDelegatedTarget] = useState('');
  const [delegatedUnit, setDelegatedUnit] = useState('%');
  const [delegatedWeight, setDelegatedWeight] = useState(25);

  // Expanded states in tree view
  const [expandedIndicators, setExpandedIndicators] = useState<Record<string, boolean>>({
    'ind-1': true,
    'ind-2': true,
    'ind-3': true
  });
  const [expandedTrajectoryId, setExpandedTrajectoryId] = useState<string | null>(null);

  const toggleExpandIndicator = (id: string) => {
    setExpandedIndicators(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Renaming and Re-ordering State
  const [renamingIndicatorId, setRenamingIndicatorId] = useState<string | null>(null);
  const [renamingNameValue, setRenamingNameValue] = useState<string>('');

  // Pakar SAKIP Interactive simulation states
  const [simSelectedIndicatorId, setSimSelectedIndicatorId] = useState<string>('custom');
  const [simCustomName, setSimCustomName] = useState<string>('Persentase efektivitas pengelolaan dan penyerapan PNBP penyiaran');
  const [simTarget, setSimTarget] = useState<number>(100);
  const [simRealization, setSimRealization] = useState<number>(85);
  const [simUnit, setSimUnit] = useState<string>('%');
  const [simLevel, setSimLevel] = useState<string>('Kepala Stasiun');
  const [simTheme, setSimTheme] = useState<'pnbp' | 'berita' | 'tu' | 'umum'>('pnbp');

  // List of all indicators for the select dropdown in SAKIP Expert tab
  const allIndicatorsList = useMemo(() => {
    const list: { indicator: PerformanceIndicator; agreement: PerformanceAgreement }[] = [];
    agreements.forEach(ag => {
      ag.objectives.forEach(ind => {
        list.push({ indicator: ind, agreement: ag });
      });
    });
    return list;
  }, [agreements]);

  const handleSelectIndicatorForSim = (id: string) => {
    setSimSelectedIndicatorId(id);
    if (id === 'custom') {
      return;
    }
    const found = allIndicatorsList.find(item => item.indicator.id === id);
    if (found) {
      setSimCustomName(found.indicator.indicatorName);
      setSimTarget(parseFloat(found.indicator.target) || 100);
      setSimRealization(found.indicator.achievement || 0);
      setSimUnit(found.indicator.unit || '%');
      setSimLevel(found.agreement.level);
      
      const nameLower = found.indicator.indicatorName.toLowerCase();
      if (nameLower.includes('pnbp') || nameLower.includes('pendapatan') || nameLower.includes('usaha')) {
        setSimTheme('pnbp');
      } else if (nameLower.includes('berita') || nameLower.includes('pemberitaan') || nameLower.includes('konten') || nameLower.includes('siaran')) {
        setSimTheme('berita');
      } else if (nameLower.includes('tata usaha') || nameLower.includes('arsip') || nameLower.includes('keuangan') || nameLower.includes('sdm')) {
        setSimTheme('tu');
      } else {
        setSimTheme('umum');
      }
    }
  };

  // List of Level 2 official levels
  const level2Options = [
    { value: 'Kabid Tata Usaha', label: `Kepala Bagian Tata Usaha (${identity.kepalaBidangNama || 'Belum Diatur'})` },
    { value: 'Ketua Tim Siaran', label: `Ketua Tim Siaran (${identity.ketuaTimSiaranNama || 'Belum Diatur'})` },
    { value: 'Ketua Tim Pemberitaan', label: `Ketua Tim Pemberitaan (${identity.ketuaTimPemberitaanNama || 'Belum Diatur'})` },
    { value: 'Ketua Tim Teknologi dan Media Baru', label: `Ketua Tim Teknologi dan Media Baru (${identity.ketuaTimTeknikNama || 'Belum Diatur'})` },
    { value: 'Ketua Tim Konten Media Baru', label: `Ketua Tim Konten Media Baru (${identity.ketuaTimKontenNama || 'Belum Diatur'})` },
    { value: 'Ketua Tim Layanan Pengembangan Usaha', label: `Ketua Tim Layanan Pengembangan Usaha (${identity.ketuaTimLayananNama || 'Belum Diatur'})` }
  ];

  // Helper to resolve name by level
  const resolveLevelName = (level: string, empId?: string): string => {
    if (level === 'Kepala Stasiun') return identity.kepalaStasiunNama || 'Kepala Stasiun';
    if (level === 'Kabid Tata Usaha') return identity.kepalaBidangNama || 'Kepala Bagian Tata Usaha';
    if (level === 'Ketua Tim Siaran') return identity.ketuaTimSiaranNama || 'Ketua Tim Siaran';
    if (level === 'Ketua Tim Pemberitaan') return identity.ketuaTimPemberitaanNama || 'Ketua Tim Pemberitaan';
    if (level === 'Ketua Tim Teknologi dan Media Baru') return identity.ketuaTimTeknikNama || 'Ketua Tim Teknologi & MB';
    if (level === 'Ketua Tim Konten Media Baru') return identity.ketuaTimKontenNama || 'Ketua Tim Konten MB';
    if (level === 'Ketua Tim Layanan Pengembangan Usaha') return identity.ketuaTimLayananNama || 'Ketua Tim Layanan PU';
    if (level === 'Pegawai' && empId) {
      const emp = employees.find(e => e.id === empId);
      return emp ? `${emp.gelarDepan ? emp.gelarDepan + ' ' : ''}${emp.nama}${emp.gelarBelakang ? ', ' + emp.gelarBelakang : ''}` : 'Pegawai';
    }
    return 'Belum ditugaskan';
  };

  const [evalPeriod, setEvalPeriod] = useState<'q1' | 'q2' | 'q3' | 'q4' | 's1' | 's2' | 'tahunan'>('tahunan');
  const [scaleTargets, setScaleTargets] = useState<boolean>(false);
  const [sakipExpertData, setSakipExpertData] = useState<{
    indicator: PerformanceIndicator;
    agreementId: string;
    assignedToName: string;
    level: string;
  } | null>(null);

  // Period helpers
  const isReportInPeriod = (r: NewsReport, period: string, year: number) => {
    if (!r.date) return false;
    const d = new Date(r.date);
    if (isNaN(d.getTime())) return false;
    if (d.getFullYear() !== year) return false;
    
    const month = d.getMonth(); // 0-11
    switch (period) {
      case 'q1': return month >= 0 && month <= 2;
      case 'q2': return month >= 3 && month <= 5;
      case 'q3': return month >= 6 && month <= 8;
      case 'q4': return month >= 9 && month <= 11;
      case 's1': return month >= 0 && month <= 5;
      case 's2': return month >= 6 && month <= 11;
      case 'tahunan':
      default:
        return true;
    }
  };

  const isContractInPeriod = (c: CooperationContract, period: string, year: number) => {
    if (!c.startDate) return false;
    const d = new Date(c.startDate);
    if (isNaN(d.getTime())) return false;
    if (d.getFullYear() !== year) return false;
    
    const month = d.getMonth(); // 0-11
    switch (period) {
      case 'q1': return month >= 0 && month <= 2;
      case 'q2': return month >= 3 && month <= 5;
      case 'q3': return month >= 6 && month <= 8;
      case 'q4': return month >= 9 && month <= 11;
      case 's1': return month >= 0 && month <= 5;
      case 's2': return month >= 6 && month <= 11;
      case 'tahunan':
      default:
        return true;
    }
  };

  // Dynamically calculate period-filtered cascading agreements
  const periodAgreements = useMemo(() => {
    // Filter newsReports & contracts for this period
    const filteredReports = newsReports.filter(r => isReportInPeriod(r, evalPeriod, selectedYear));
    const filteredContracts = contracts.filter(c => isContractInPeriod(c, evalPeriod, selectedYear));

    // Compute total PNBP
    const totalPnbpForPeriod = filteredContracts
      .filter(c => c.linkedIndicatorId === 'ind-11')
      .reduce((sum, c) => sum + c.realizedPnbp, 0);

    // Filter agreements for this year
    const yearAgs = agreements.filter(ag => ag.year === selectedYear);

    // Set employee reports counts
    const reportCountsByEmployee: Record<string, number> = {};
    filteredReports.forEach(r => {
      reportCountsByEmployee[r.employeeId] = (reportCountsByEmployee[r.employeeId] || 0) + 1;
    });

    const getMonthIndicesForPeriod = (period: string): number[] => {
      switch (period) {
        case 'q1': return [0, 1, 2];
        case 'q2': return [3, 4, 5];
        case 'q3': return [6, 7, 8];
        case 'q4': return [9, 10, 11];
        case 's1': return [0, 1, 2, 3, 4, 5];
        case 's2': return [6, 7, 8, 9, 10, 11];
        case 'tahunan':
        default:
          return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      }
    };

    // Calculate direct Level 3 (Pegawai) and other base level achievements
    let tempAgs = yearAgs.map(ag => {
      const objectives = ag.objectives.map(obj => {
        let achievement = obj.achievement;
        let targetVal = parseFloat(obj.target) || 100;
        const isUsingTrajectory = !!obj.trajectory && obj.trajectory.length === 12;

        if (obj.id === 'ind-11' || obj.indicatorName.toLowerCase().includes('pnbp')) {
          achievement = totalPnbpForPeriod;
        }

        if (ag.level === 'Pegawai' && ag.assignedToEmployeeId) {
          const empId = ag.assignedToEmployeeId;
          const empTargets = reporterTargets.filter(t => t.employeeId === empId);
          const matchedTarget = empTargets.find(t => t.linkedIndicatorId === obj.id);
          if (matchedTarget) {
            achievement = reportCountsByEmployee[empId] || 0;
          }
        }

        // Apply trajectory calculations if configured
        if (isUsingTrajectory) {
          const activeMonths = getMonthIndicesForPeriod(evalPeriod);
          const type = obj.trajectoryType || (obj.unit === '%' || obj.indicatorName.toLowerCase().includes('ikpa') || obj.indicatorName.toLowerCase().includes('nilai') ? 'constant' : 'cumulative');

          if (type === 'constant') {
            // Target is average of the period
            const sumTargets = activeMonths.reduce((sum, idx) => sum + (obj.trajectory?.[idx] ?? 0), 0);
            targetVal = sumTargets / activeMonths.length;

            if (obj.monthlyAchievements && obj.monthlyAchievements.length === 12) {
              const sumAch = activeMonths.reduce((sum, idx) => sum + (obj.monthlyAchievements?.[idx] ?? 0), 0);
              achievement = sumAch / activeMonths.length;
            }
          } else {
            // Cumulative: target is sum of the period
            targetVal = activeMonths.reduce((sum, idx) => sum + (obj.trajectory?.[idx] ?? 0), 0);

            if (obj.monthlyAchievements && obj.monthlyAchievements.length === 12) {
              achievement = activeMonths.reduce((sum, idx) => sum + (obj.monthlyAchievements?.[idx] ?? 0), 0);
            }
          }
        }

        // Apply target scaling if checked (only if not using trajectory)
        let targetString = obj.target;
        if (scaleTargets && !isUsingTrajectory) {
          const fraction = evalPeriod.startsWith('q') ? 0.25 : evalPeriod.startsWith('s') ? 0.5 : 1.0;
          const scaledVal = targetVal * fraction;
          if (obj.target.includes('%')) {
            targetString = `${Math.round(scaledVal)}%`;
          } else {
            const unitMatch = obj.target.match(/[a-zA-Z]+/);
            const unitStr = unitMatch ? ' ' + unitMatch[0] : '';
            targetString = `${Math.round(scaledVal)}${unitStr}`;
          }
          targetVal = scaledVal;
        } else if (isUsingTrajectory) {
          if (obj.target.includes('%') || obj.unit === '%') {
            targetString = `${Math.round(targetVal)}%`;
          } else {
            targetString = `${Math.round(targetVal)} ${obj.unit}`;
          }
        }

        return { 
          ...obj, 
          _scaledTargetVal: targetVal, 
          _scaledTargetString: targetString, 
          achievement: Math.round(achievement * 10) / 10 
        };
      });
      return { ...ag, objectives };
    });

    // Roll up Level 3 to Level 2 (Ketua Tim / Kabid)
    tempAgs = tempAgs.map(ag => {
      if (ag.level !== 'Kepala Stasiun' && ag.level !== 'Pegawai') {
        const objectives = ag.objectives.map(l2Obj => {
          // If Direct Intervention is enabled (manual), use Level 2's direct value instead of rolling up
          if (l2Obj.calculationType === 'manual') {
            return l2Obj;
          }

          const l3Objectives: { achievement: number; target: number; unit: string }[] = [];
          tempAgs.forEach(otherAg => {
            if (otherAg.level === 'Pegawai') {
              otherAg.objectives.forEach(obj => {
                if (obj.parentIndicatorId === l2Obj.id) {
                  l3Objectives.push({ 
                    achievement: obj.achievement || 0, 
                    target: obj._scaledTargetVal !== undefined ? obj._scaledTargetVal : (parseFloat(obj.target) || 100), 
                    unit: obj.unit 
                  });
                }
              });
            }
          });

          if (l3Objectives.length > 0) {
            const isAbsolute = ['berita', 'konten', 'laporan', 'dokumen', 'video'].some(u => l2Obj.unit.toLowerCase().includes(u));
            if (isAbsolute) {
              const sumAchievement = l3Objectives.reduce((sum, child) => sum + child.achievement, 0);
              return { ...l2Obj, achievement: Math.round(sumAchievement * 10) / 10 };
            } else {
              const totalProgress = l3Objectives.reduce((sum, child) => {
                const progress = child.target > 0 ? (child.achievement / child.target) * 100 : 0;
                return sum + Math.min(120, progress);
              }, 0);
              const avgProgress = totalProgress / l3Objectives.length;
              const targetVal = l2Obj._scaledTargetVal !== undefined ? l2Obj._scaledTargetVal : (parseFloat(l2Obj.target) || 100);
              const newAchievement = Math.round((avgProgress / 100) * targetVal * 10) / 10;
              return { ...l2Obj, achievement: newAchievement };
            }
          }
          return l2Obj;
        });
        return { ...ag, objectives };
      }
      return ag;
    });

    // Roll up Level 2 to Level 1 (Kepala Stasiun)
    tempAgs = tempAgs.map(ag => {
      if (ag.level === 'Kepala Stasiun') {
        const objectives = ag.objectives.map(rootObj => {
          const l2Objectives: { achievement: number; target: number }[] = [];
          tempAgs.forEach(otherAg => {
            if (otherAg.level !== 'Kepala Stasiun' && otherAg.level !== 'Pegawai') {
              otherAg.objectives.forEach(obj => {
                if (obj.parentIndicatorId === rootObj.id) {
                  l2Objectives.push({ 
                    achievement: obj.achievement || 0, 
                    target: obj._scaledTargetVal !== undefined ? obj._scaledTargetVal : (parseFloat(obj.target) || 100) 
                  });
                }
              });
            }
          });

          if (l2Objectives.length > 0) {
            const totalProgress = l2Objectives.reduce((sum, child) => {
              const progress = (child.achievement / child.target) * 100;
              return sum + Math.min(120, progress);
            }, 0);
            const avgProgress = totalProgress / l2Objectives.length;
            const targetVal = rootObj._scaledTargetVal !== undefined ? rootObj._scaledTargetVal : (parseFloat(rootObj.target) || 100);
            const newAchievement = Math.round((avgProgress / 100) * targetVal * 10) / 10;
            return { ...rootObj, achievement: newAchievement };
          }
          return rootObj;
        });
        return { ...ag, objectives };
      }
      return ag;
    });

    return tempAgs;
  }, [agreements, selectedYear, evalPeriod, scaleTargets, newsReports, contracts, reporterTargets]);

  // Total Statistics
  const stats = useMemo(() => {
    let totalIndicators = 0;
    let sumAchievement = 0;
    let activePks = 0;

    periodAgreements.forEach(a => {
      if (a.objectives.length > 0) {
        if (a.status === 'Aktif') activePks++;
        a.objectives.forEach(obj => {
          totalIndicators++;
          // Calculate achievement percentage score using dynamic getIndicatorScore helper
          const score = getIndicatorScore(obj);
          sumAchievement += score;
        });
      }
    });

    const avgAchievement = totalIndicators > 0 ? Math.round(sumAchievement / totalIndicators) : 0;

    return {
      totalIndicators,
      avgAchievement,
      activePks,
      totalPks: periodAgreements.filter(a => a.objectives.length > 0).length
    };
  }, [periodAgreements]);

  // Cascading tree indexing (uses resolved periodAgreements for complete parity)
  const treeData = useMemo(() => {
    const kepalaStasiunAg = periodAgreements.find(a => a.level === 'Kepala Stasiun');
    
    if (!kepalaStasiunAg) return [];

    return kepalaStasiunAg.objectives.map(rootObj => {
      // Find level 2 indicators linked to this root
      const level2Objects: Array<{
        indicator: PerformanceIndicator;
        agreement: PerformanceAgreement;
        children: Array<{
          indicator: PerformanceIndicator;
          agreement: PerformanceAgreement;
        }>;
      }> = [];

      periodAgreements.forEach(ag => {
        if (ag.level !== 'Kepala Stasiun' && ag.level !== 'Pegawai') {
          ag.objectives.forEach(obj => {
            if (obj.parentIndicatorId === rootObj.id) {
              // Find level 3 indicators linked to this level 2 indicator
              const children: Array<{
                indicator: PerformanceIndicator;
                agreement: PerformanceAgreement;
              }> = [];

              periodAgreements.forEach(pPeg => {
                if (pPeg.level === 'Pegawai') {
                  pPeg.objectives.forEach(pegObj => {
                    if (pegObj.parentIndicatorId === obj.id) {
                      children.push({ indicator: pegObj, agreement: pPeg });
                    }
                  });
                }
              });

              level2Objects.push({
                indicator: obj,
                agreement: ag,
                children
              });
            }
          });
        }
      });

      return {
        root: rootObj,
        agreement: kepalaStasiunAg,
        level2: level2Objects
      };
    });
  }, [periodAgreements]);

  // Find all active child delegations for the currently selected delegating target
  const existingDelegationsForCurrent = useMemo(() => {
    if (!delegatingIndicator) return [];
    const list: Array<{
      indicator: PerformanceIndicator;
      agreement: PerformanceAgreement;
    }> = [];
    
    agreements.forEach(ag => {
      if (ag.year === selectedYear) {
        ag.objectives.forEach(obj => {
          if (obj.parentIndicatorId === delegatingIndicator.indicator.id) {
            list.push({ indicator: obj, agreement: ag });
          }
        });
      }
    });
    return list;
  }, [delegatingIndicator, agreements, selectedYear]);

  // Handle adding a performance indicator to an agreement
  const handleAddIndicator = (agreementId: string) => {
    if (!newIndicatorName || !newIndicatorTarget) return;

    const newObj: PerformanceIndicator = {
      id: `ind-${Date.now()}`,
      indicatorName: newIndicatorName,
      target: newIndicatorTarget,
      unit: newIndicatorUnit,
      weight: newIndicatorWeight,
      achievement: 0
    };

    const isNewKepala = agreementId.startsWith('pk-kepala-');
    let updated: PerformanceAgreement[];

    if (isNewKepala) {
      const newAg: PerformanceAgreement = {
        id: agreementId,
        year: selectedYear,
        level: 'Kepala Stasiun',
        assignedToName: resolveLevelName('Kepala Stasiun'),
        objectives: [newObj],
        status: 'Aktif',
        createdAt: new Date().toISOString()
      };
      updated = [...agreements, newAg];
    } else {
      updated = agreements.map(ag => {
        if (ag.id === agreementId) {
          return {
            ...ag,
            objectives: [...ag.objectives, newObj]
          };
        }
        return ag;
      });
    }

    onUpdateAgreements(updated);
    setNewIndicatorName('');
    setNewIndicatorTarget('');
    setNewIndicatorUnit('%');
    setNewIndicatorWeight(25);
    setEditingAgreementId(null);
  };

  // Handle deleting an indicator with cascading cleanup
  const handleDeleteIndicator = (agreementId: string, indicatorId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus indikator sasaran kinerja ini? Seluruh pendelegasian sasaran turunan (Level 2 & Level 3) yang terhubung juga akan dihapus secara kaskade.")) return;

    // Recursive helper to find all child/grandchild indicators
    const getIdsToDelete = (startId: string): string[] => {
      const ids = [startId];
      let queue = [startId];
      
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        // Find child indicators in all agreements
        agreements.forEach(ag => {
          ag.objectives.forEach(obj => {
            if (obj.parentIndicatorId === currentId && !ids.includes(obj.id)) {
              ids.push(obj.id);
              queue.push(obj.id);
            }
          });
        });
      }
      return ids;
    };

    const allIdsToDelete = getIdsToDelete(indicatorId);

    const updated = agreements.map(ag => {
      return {
        ...ag,
        objectives: ag.objectives.filter(o => !allIdsToDelete.includes(o.id))
      };
    });

    onUpdateAgreements(updated);
  };

  // Handle updating achievement
  const handleUpdateAchievement = (agreementId: string, indicatorId: string, value: number) => {
    const updated = agreements.map(ag => {
      if (ag.id === agreementId) {
        return {
          ...ag,
          objectives: ag.objectives.map(o => o.id === indicatorId ? { ...o, achievement: value } : o)
        };
      }
      return ag;
    });
    onUpdateAgreements(updated);
  };

  // Helper to safely resolve a 12-month trajectory array
  const getSafeTrajectory = (indicator: PerformanceIndicator) => {
    if (indicator.trajectory && indicator.trajectory.length === 12) {
      return indicator.trajectory;
    }
    const targetNum = parseFloat(indicator.target) || 0;
    const isPct = indicator.target.includes('%') || indicator.unit === '%';
    if (isPct) {
      return Array(12).fill(targetNum);
    }
    const share = Math.round((targetNum / 12) * 10) / 10;
    return Array(12).fill(share);
  };

  // Handle updating target value
  const handleUpdateTarget = (agreementId: string, indicatorId: string, newTarget: string) => {
    const updated = agreements.map(ag => {
      if (ag.id === agreementId) {
        return {
          ...ag,
          objectives: ag.objectives.map(o => o.id === indicatorId ? { ...o, target: newTarget } : o)
        };
      }
      return ag;
    });
    onUpdateAgreements(updated);
  };

  // Handle updating target trajectory per month
  const handleUpdateTrajectory = (agreementId: string, indicatorId: string, monthIndex: number, value: number) => {
    const updated = agreements.map(ag => {
      if (ag.id === agreementId) {
        return {
          ...ag,
          objectives: ag.objectives.map(o => {
            if (o.id === indicatorId) {
              const currentTrajectory = [...getSafeTrajectory(o)];
              currentTrajectory[monthIndex] = value;
              return { ...o, trajectory: currentTrajectory };
            }
            return o;
          })
        };
      }
      return ag;
    });
    onUpdateAgreements(updated);
  };

  // Helper to safely resolve a 12-month achievement array
  const getSafeMonthlyAchievements = (indicator: PerformanceIndicator) => {
    if (indicator.monthlyAchievements && indicator.monthlyAchievements.length === 12) {
      return indicator.monthlyAchievements;
    }
    return Array(12).fill(0);
  };

  // Handle updating achievement trajectory per month
  const handleUpdateMonthlyAchievement = (agreementId: string, indicatorId: string, monthIndex: number, value: number) => {
    const updated = agreements.map(ag => {
      if (ag.id === agreementId) {
        return {
          ...ag,
          objectives: ag.objectives.map(o => {
            if (o.id === indicatorId) {
              const currentAchievements = [...getSafeMonthlyAchievements(o)];
              currentAchievements[monthIndex] = value;
              
              // Recalculate annual value for backward compatibility & direct display
              const type = o.trajectoryType || (o.unit === '%' || o.indicatorName.toLowerCase().includes('ikpa') || o.indicatorName.toLowerCase().includes('nilai') ? 'constant' : 'cumulative');
              let annualAchievement = 0;
              if (type === 'constant') {
                annualAchievement = currentAchievements.reduce((sum, v) => sum + v, 0) / 12;
              } else {
                annualAchievement = currentAchievements.reduce((sum, v) => sum + v, 0);
              }
              
              return { 
                ...o, 
                monthlyAchievements: currentAchievements,
                achievement: Math.round(annualAchievement * 10) / 10 
              };
            }
            return o;
          })
        };
      }
      return ag;
    });
    onUpdateAgreements(updated);
  };

  // Handle updating trajectory accumulation type (cumulative vs constant/average)
  const handleUpdateTrajectoryType = (agreementId: string, indicatorId: string, type: 'cumulative' | 'constant') => {
    const updated = agreements.map(ag => {
      if (ag.id === agreementId) {
        return {
          ...ag,
          objectives: ag.objectives.map(o => {
            if (o.id === indicatorId) {
              const currentAchievements = [...getSafeMonthlyAchievements(o)];
              let annualAchievement = 0;
              if (type === 'constant') {
                annualAchievement = currentAchievements.reduce((sum, v) => sum + v, 0) / 12;
              } else {
                annualAchievement = currentAchievements.reduce((sum, v) => sum + v, 0);
              }

              let updatedTrajectory = o.trajectory;
              if (type === 'constant') {
                const numMatch = o.target.match(/([\d\.,]+)/);
                const targetNum = numMatch ? parseFloat(numMatch[1].replace(/,/g, '')) : 0;
                updatedTrajectory = Array(12).fill(targetNum);
              }

              return { 
                ...o, 
                trajectoryType: type,
                trajectory: updatedTrajectory,
                achievement: Math.round(annualAchievement * 10) / 10
              };
            }
            return o;
          })
        };
      }
      return ag;
    });
    onUpdateAgreements(updated);
  };

  // Handle updating evaluation frequency (periodType)
  const handleUpdatePeriodType = (agreementId: string, indicatorId: string, type: 'tahunan' | 'triwulanan' | 'semesteran') => {
    const updated = agreements.map(ag => {
      if (ag.id === agreementId) {
        return {
          ...ag,
          objectives: ag.objectives.map(o => o.id === indicatorId ? { ...o, periodType: type } : o)
        };
      }
      return ag;
    });
    onUpdateAgreements(updated);
  };

  // Handle resetting/cancelling trajectory to restore to original non-trajectory state
  const handleResetTrajectory = (agreementId: string, indicatorId: string) => {
    const updated = agreements.map(ag => {
      if (ag.id === agreementId) {
        return {
          ...ag,
          objectives: ag.objectives.map(o => {
            if (o.id === indicatorId) {
              const updatedObj = { ...o };
              delete updatedObj.trajectory;
              delete updatedObj.trajectoryType;
              delete updatedObj.monthlyAchievements;
              
              // Also reset achievement to 0 so the cascade or manual input can re-initialize it
              updatedObj.achievement = 0;
              
              return updatedObj;
            }
            return o;
          })
        };
      }
      return ag;
    });
    onUpdateAgreements(updated);

    if (onAddNotification) {
      onAddNotification({
        id: Math.random().toString(36).substr(2, 9),
        title: "Trajectory Dibatalkan",
        message: `Trajectory berhasil dibatalkan dan dikembalikan ke awal.`,
        type: "info",
        timestamp: new Date().toISOString(),
        isRead: false
      });
    }
  };

  // Handle updating Level 2 calculation type (automatic from staff vs manual direct entry)
  const handleUpdateCalculationType = (agreementId: string, indicatorId: string, type: 'automatic' | 'manual') => {
    const updated = agreements.map(ag => {
      if (ag.id === agreementId) {
        return {
          ...ag,
          objectives: ag.objectives.map(o => o.id === indicatorId ? { ...o, calculationType: type } : o)
        };
      }
      return ag;
    });
    onUpdateAgreements(updated);
  };

  // Handle renaming indicator
  const handleSaveRename = (agreementId: string, indicatorId: string) => {
    if (!renamingNameValue.trim()) return;
    const updated = agreements.map(ag => {
      if (ag.id === agreementId) {
        return {
          ...ag,
          objectives: ag.objectives.map(o => o.id === indicatorId ? { ...o, indicatorName: renamingNameValue } : o)
        };
      }
      return ag;
    });
    onUpdateAgreements(updated);
    setRenamingIndicatorId(null);
    setRenamingNameValue('');
  };

  // Handle moving objectives Up or Down for ordering
  const handleMoveObjective = (agreementId: string, indicatorId: string, direction: 'up' | 'down') => {
    const updated = agreements.map(ag => {
      if (ag.id === agreementId) {
        const idx = ag.objectives.findIndex(o => o.id === indicatorId);
        if (idx === -1) return ag;

        const newObjectives = [...ag.objectives];
        if (direction === 'up' && idx > 0) {
          const temp = newObjectives[idx];
          newObjectives[idx] = newObjectives[idx - 1];
          newObjectives[idx - 1] = temp;
        } else if (direction === 'down' && idx < newObjectives.length - 1) {
          const temp = newObjectives[idx];
          newObjectives[idx] = newObjectives[idx + 1];
          newObjectives[idx + 1] = temp;
        }

        return {
          ...ag,
          objectives: newObjectives
        };
      }
      return ag;
    });
    onUpdateAgreements(updated);
  };

  // Handle adding an evaluation comment/feedback
  const handleAddComment = (agreementId: string, indicatorId: string, commentText: string) => {
    if (!commentText.trim() || !currentUser) return;

    const newComment: IndicatorComment = {
      id: `comment-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      text: commentText,
      timestamp: new Date().toISOString()
    };

    const updated = agreements.map(ag => {
      if (ag.id === agreementId) {
        return {
          ...ag,
          objectives: ag.objectives.map(o => {
            if (o.id === indicatorId) {
              return {
                ...o,
                comments: [...(o.comments || []), newComment]
              };
            }
            return o;
          })
        };
      }
      return ag;
    });

    onUpdateAgreements(updated);

    // Send a notification if pimpinan adds feedback
    if (onAddNotification && (currentUser.role === 'Kepala' || currentUser.role === 'Ketua Bidang' || currentUser.role === 'Superadmin')) {
      const targetAgreement = agreements.find(ag => ag.id === agreementId);
      if (targetAgreement) {
        const objName = targetAgreement.objectives.find(o => o.id === indicatorId)?.indicatorName || '';
        onAddNotification({
          id: `notif-comment-${Date.now()}`,
          title: 'Feedback Evaluasi Baru',
          message: `${currentUser.name} (${currentUser.role}) memberikan catatan evaluasi pada sasaran kinerja: "${objName}"`,
          type: 'info',
          timestamp: new Date().toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          isRead: false
        });
      }
    }
  };

  // Handle deleting a comment
  const handleDeleteComment = (agreementId: string, indicatorId: string, commentId: string) => {
    const updated = agreements.map(ag => {
      if (ag.id === agreementId) {
        return {
          ...ag,
          objectives: ag.objectives.map(o => {
            if (o.id === indicatorId) {
              return {
                ...o,
                comments: (o.comments || []).filter(c => c.id !== commentId)
              };
            }
            return o;
          })
        };
      }
      return ag;
    });

    onUpdateAgreements(updated);
  };

  // Open delegation popup
  const openDelegation = (indicator: PerformanceIndicator, sourceAgreement: PerformanceAgreement) => {
    setDelegatingIndicator({ indicator, sourceAgreement });
    
    // Auto preset values
    setDelegatedIndicatorName(`Dukungan Pencapaian: ${indicator.indicatorName}`);
    setDelegatedTarget('');
    setDelegatedUnit(indicator.unit);
    setDelegatedWeight(25);
    
    // Set appropriate delegation level options
    if (sourceAgreement.level === 'Kepala Stasiun') {
      setDelegateLevel('Kabid Tata Usaha');
      setDelegateEmployeeId('');
    } else {
      setDelegateLevel('Pegawai');
      // pre-select first employee
      const subDeps = employees.filter(e => {
        // filter by matching division
        if (sourceAgreement.level === 'Kabid Tata Usaha') return e.divisi === 'Tata Usaha / Umum';
        if (sourceAgreement.level === 'Ketua Tim Siaran') return e.divisi === 'Siaran';
        if (sourceAgreement.level === 'Ketua Tim Pemberitaan') return e.divisi === 'Pemberitaan';
        if (sourceAgreement.level === 'Ketua Tim Teknologi dan Media Baru') return e.divisi === 'Teknologi dan Media Baru';
        if (sourceAgreement.level === 'Ketua Tim Konten Media Baru') return e.divisi === 'Konten Media Baru';
        if (sourceAgreement.level === 'Ketua Tim Layanan Pengembangan Usaha') return e.divisi === 'Layanan Pengembangan Usaha';
        return true;
      });
      setDelegateEmployeeId(subDeps[0]?.id || '');
    }
  };

  // Submit delegation
  const submitDelegation = () => {
    if (!delegatingIndicator || !delegatedIndicatorName || !delegatedTarget) return;

    // Find if target agreement already exists
    const existingAgIndex = agreements.findIndex(a => 
      a.year === selectedYear && 
      a.level === delegateLevel && 
      (delegateLevel !== 'Pegawai' || a.assignedToEmployeeId === delegateEmployeeId)
    );

    const newDelegatedIndicator: PerformanceIndicator = {
      id: `ind-${Date.now()}`,
      indicatorName: delegatedIndicatorName,
      target: delegatedTarget,
      unit: delegatedUnit,
      weight: delegatedWeight,
      achievement: 0,
      parentIndicatorId: delegatingIndicator.indicator.id // CRITICAL for cascade tracing!
    };

    let updated: PerformanceAgreement[];

    if (existingAgIndex !== -1) {
      // Update existing
      updated = agreements.map((ag, idx) => {
        if (idx === existingAgIndex) {
          return {
            ...ag,
            objectives: [...ag.objectives, newDelegatedIndicator]
          };
        }
        return ag;
      });
    } else {
      // Create a brand new agreement with the indicator pre-filled
      const newAgId = `pk-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newAg: PerformanceAgreement = {
        id: newAgId,
        year: selectedYear,
        level: delegateLevel as any,
        assignedToEmployeeId: delegateLevel === 'Pegawai' ? delegateEmployeeId : undefined,
        assignedToName: resolveLevelName(delegateLevel, delegateLevel === 'Pegawai' ? delegateEmployeeId : undefined),
        objectives: [newDelegatedIndicator],
        status: 'Aktif',
        createdAt: new Date().toISOString()
      };
      updated = [...agreements, newAg];
    }

    onUpdateAgreements(updated);

    // Trigger critical notification for subordinate
    if (onAddNotification) {
      const targetName = delegateLevel === 'Pegawai' 
        ? resolveLevelName(delegateLevel, delegateEmployeeId)
        : delegateLevel;

      onAddNotification({
        id: `notif-pk-delegation-${Date.now()}`,
        title: "Pendelegasian Sasaran Baru",
        message: `Sasaran Kinerja "${delegatedIndicatorName}" (Target: ${delegatedTarget} ${delegatedUnit}) telah didelegasikan kepada ${targetName}. Harap segera laksanakan tindak lanjut.`,
        type: "warning",
        timestamp: new Date().toISOString(),
        isRead: false,
        metricName: "IKU Terkait",
        metricValue: delegatingIndicator.indicator.indicatorName
      });
    }
    
    // Trigger quick visual notification for beautiful feedback
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {}

    // Close delegation state
    setDelegatingIndicator(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-extrabold tracking-wider uppercase border border-indigo-500/30">
               cascading system 
            </span>
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 font-mono">STANDAR PERPRES 8/2021</span>
          </div>
          <h2 className="text-xl font-black tracking-tight">Perjanjian Kinerja & Cascading Sasaran</h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Penyusunan target kinerja berjenjang dari Kepala Stasiun Radio, didelegasikan kepada Ketua Tim dan Kepala Bidang, hingga ke tingkat capaian sasaran kinerja Pegawai.
          </p>
        </div>

        {/* Year & Navigation Selector */}
        <div className="flex items-center gap-2 shrink-0 bg-slate-950/40 p-2 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-1.5 px-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">Tahun Dokumen:</span>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent text-indigo-400 font-extrabold text-xs focus:outline-hidden"
            >
              <option value={2026} className="bg-slate-900 text-white">2026 (Aktif)</option>
              <option value={2027} className="bg-slate-900 text-white">2027</option>
            </select>
          </div>
          
          <div className="h-5 w-px bg-slate-800" />

          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('pohon')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                activeTab === 'pohon' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pohon Kinerja
            </button>
            <button
              onClick={() => setActiveTab('evaluasi')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                activeTab === 'evaluasi' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Evaluasi Berkala (Triwulan/Semester)
            </button>
          </div>
        </div>
      </div>

      {/* Statistical metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase font-mono leading-none">Total Indikator</p>
            <p className="text-lg font-black text-slate-800 mt-1 leading-none">{stats.totalIndicators} Sasaran</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase font-mono leading-none">Rata-Rata Capaian</p>
            <p className="text-lg font-black text-slate-800 mt-1 leading-none">{stats.avgAchievement}%</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase font-mono leading-none">PK Aktif / Total</p>
            <p className="text-lg font-black text-slate-800 mt-1 leading-none">{stats.activePks} / {stats.totalPks}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase font-mono leading-none">Status Kaskade</p>
            <p className="text-lg font-black text-slate-800 mt-1 leading-none">Terintegrasi</p>
          </div>
        </div>
      </div>

      {/* Main Tab Content Workspace */}
      {activeTab === 'pohon' ? (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <GitFork className="w-4 h-4 text-indigo-500" />
                Silsilah Cascading Sasaran Kinerja (Pohon Kinerja)
              </h3>
              <p className="text-[11px] text-slate-400">Peta penyelarasan indikator kinerja dari Kepala Stasiun turun langsung ke tim hingga individu pegawai.</p>
            </div>
            
            {canEditAgreement('Kepala Stasiun') && (
              <button
                onClick={() => {
                  const existing = agreements.find(a => a.year === selectedYear && a.level === 'Kepala Stasiun');
                  if (existing) {
                    setEditingAgreementId(existing.id);
                  } else {
                    setEditingAgreementId(`pk-kepala-${Date.now()}`);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors self-start"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Sasaran Kepala Stasiun
              </button>
            )}
          </div>

          {/* Root Level 1 Tree Nodes */}
          <div className="space-y-4">
            {treeData.length === 0 ? (
              <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-400 italic">Belum ada sasaran Kepala Stasiun yang diatur.</p>
                {canEditAgreement('Kepala Stasiun') && (
                  <button
                    onClick={() => {
                      const existing = agreements.find(a => a.year === selectedYear && a.level === 'Kepala Stasiun');
                      if (existing) {
                        setEditingAgreementId(existing.id);
                      } else {
                        setEditingAgreementId(`pk-kepala-${Date.now()}`);
                      }
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
                  >
                    <Plus className="w-3.5 h-3.5" /> Buat Perjanjian Kinerja
                  </button>
                )}
              </div>
            ) : (
              treeData.map((node, idx) => {
                const rootId = node.root.id;
                const isExpanded = !!expandedIndicators[rootId];
                
                // Calculate score
                const rootScore = getIndicatorScore(node.root);

                return (
                  <div key={rootId} className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
                    
                    {/* Header - Kepala Stasiun Level 1 Objective */}
                    <div className="bg-slate-50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100">
                      
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button 
                          onClick={() => toggleExpandIndicator(rootId)}
                          className="mt-0.5 p-1 hover:bg-slate-200 text-slate-500 rounded-lg shrink-0 transition-colors"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>

                        <div className="space-y-1 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-black uppercase rounded-md border border-purple-200">
                              LEVEL 1 • KEPALA STASIUN
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {rootId}</span>
                            
                            {/* Reordering Controls for Level 1 */}
                            {canEditAgreement('Kepala Stasiun') && (
                              <div className="flex items-center gap-1 ml-2 bg-slate-200/50 rounded-lg p-0.5">
                                <button
                                  onClick={() => handleMoveObjective(node.agreement.id, rootId, 'up')}
                                  className="p-1 hover:bg-slate-300 rounded text-slate-600 transition-colors"
                                  title="Pindahkan ke Atas"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleMoveObjective(node.agreement.id, rootId, 'down')}
                                  className="p-1 hover:bg-slate-300 rounded text-slate-600 transition-colors"
                                  title="Pindahkan ke Bawah"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          {renamingIndicatorId === rootId ? (
                            <div className="flex items-center gap-2 mt-1 max-w-xl">
                              <input
                                type="text"
                                value={renamingNameValue}
                                onChange={(e) => setRenamingNameValue(e.target.value)}
                                className="flex-1 text-xs bg-white border border-indigo-400 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveRename(node.agreement.id, rootId);
                                  if (e.key === 'Escape') setRenamingIndicatorId(null);
                                }}
                              />
                              <button
                                onClick={() => handleSaveRename(node.agreement.id, rootId)}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                                title="Simpan"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setRenamingIndicatorId(null)}
                                className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition-colors"
                                title="Batal"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <h4 className="text-xs font-bold text-slate-800 leading-normal">{node.root.indicatorName}</h4>
                              {canEditAgreement('Kepala Stasiun') && (
                                <button
                                  onClick={() => {
                                    setRenamingIndicatorId(rootId);
                                    setRenamingNameValue(node.root.indicatorName);
                                  }}
                                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-200 text-slate-500 rounded-md transition-all"
                                  title="Ubah Nama PK"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                          <p className="text-[10px] text-slate-400">Penanggung Jawab: <span className="font-bold text-slate-600">{node.agreement.assignedToName}</span></p>
                        </div>
                      </div>

                      {/* Right Metrics / Actions */}
                      <div className="flex items-center flex-wrap gap-4 text-xs">
                        <div className="bg-white border border-slate-200/60 rounded-xl px-2.5 py-1">
                          <span className="text-[9px] text-slate-400 block font-mono">TARGET</span>
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="text"
                              value={node.root.target}
                              onChange={(e) => handleUpdateTarget(node.agreement.id, rootId, e.target.value)}
                              disabled={!canEditAgreement('Kepala Stasiun')}
                              className="w-16 bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-center font-extrabold text-slate-800 text-[11px] focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                            <span className="text-[10px] text-slate-400 font-extrabold">{node.root.unit}</span>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200/60 rounded-xl px-2.5 py-1">
                          <span className="text-[9px] text-slate-400 block font-mono">REALISASI</span>
                          <div className="flex items-center gap-1">
                            <input 
                              type="number"
                              value={node.root.achievement}
                              onChange={(e) => handleUpdateAchievement(node.agreement.id, rootId, parseFloat(e.target.value) || 0)}
                              disabled={!canEditAgreement('Kepala Stasiun')}
                              className="w-12 bg-slate-50 border border-slate-200 rounded px-1 text-center font-bold text-slate-800 text-[11px] focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                            <span className="text-[10px] text-slate-400">{node.root.unit}</span>
                          </div>
                        </div>

                        {/* Progress Ring or Bar representation */}
                        <div className="text-center min-w-[50px]">
                          <span className="text-[9px] text-slate-400 block font-mono">CAPAIAN</span>
                          <span className={`font-black text-xs ${
                            rootScore >= 100 ? 'text-emerald-600' : rootScore >= 75 ? 'text-blue-600' : 'text-amber-500'
                          }`}>{rootScore}%</span>
                        </div>

                        {/* Level 1 Trajectory Trigger Button */}
                        <div className="text-center">
                          <button
                            onClick={() => setExpandedTrajectoryId(expandedTrajectoryId === rootId ? null : rootId)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-all text-[10px] font-black uppercase tracking-wide ${
                              expandedTrajectoryId === rootId 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-indigo-600'
                            }`}
                            title="Atur Proyeksi Trajectory Target Bulanan"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                            Trajectory {node.root.trajectory ? '✓' : ''}
                          </button>
                        </div>

                        {canEditAgreement('Kepala Stasiun') && (
                          <div className="flex items-center gap-1 border-l border-slate-200 pl-4">
                            <button
                              onClick={() => openDelegation(node.root, node.agreement)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-black rounded-lg transition-colors uppercase tracking-wide"
                              title="Delegasikan target ini kepada Kepala Bidang atau Ketua Tim"
                            >
                              <Send className="w-3 h-3" /> Delegasikan
                            </button>
                            <button
                              onClick={() => handleDeleteIndicator(node.agreement.id, rootId)}
                              className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                      </div>
                    </div>

                    {/* Level 1 Trajectory Panel */}
                    {expandedTrajectoryId === rootId && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5 shadow-inner">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-indigo-500" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 font-mono">
                              Trajectory & Realisasi Bulanan (Level 1)
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Model:</span>
                              <select
                                value={node.root.trajectoryType || (node.root.unit === '%' ? 'constant' : 'cumulative')}
                                onChange={(e) => handleUpdateTrajectoryType(node.agreement.id, rootId, e.target.value as 'cumulative' | 'constant')}
                                className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[9px] font-extrabold text-slate-700 focus:outline-hidden"
                              >
                                <option value="cumulative">Akumulatif (Penjumlahan)</option>
                                <option value="constant">Konstan / Rata-rata (e.g. IKPA 100%)</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Frekuensi Capaian:</span>
                              <select
                                value={node.root.periodType || 'tahunan'}
                                onChange={(e) => handleUpdatePeriodType(node.agreement.id, rootId, e.target.value as 'tahunan' | 'triwulanan' | 'semesteran')}
                                className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[9px] font-extrabold text-slate-700 focus:outline-hidden"
                              >
                                <option value="tahunan">Tahunan / Bulanan</option>
                                <option value="triwulanan">Triwulanan (Quarterly)</option>
                                <option value="semesteran">Semesteran (Semesterly)</option>
                              </select>
                            </div>
                            <button
                              onClick={() => {
                                const targetNum = parseFloat(node.root.target) || 0;
                                const type = node.root.trajectoryType || (node.root.unit === '%' ? 'constant' : 'cumulative');
                                const share = Math.round((targetNum / 12) * 10) / 10;
                                const distrib = Array(12).fill(type === 'constant' ? targetNum : share);
                                
                                const updated = agreements.map(ag => {
                                  if (ag.id === node.agreement.id) {
                                    return {
                                      ...ag,
                                      objectives: ag.objectives.map(o => o.id === rootId ? { ...o, trajectory: distrib } : o)
                                    };
                                  }
                                  return ag;
                                });
                                onUpdateAgreements(updated);
                              }}
                              className="text-[9px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200"
                            >
                              Bagi Rata Target
                            </button>
                            {node.root.trajectory && (
                              <button
                                onClick={() => {
                                  if (window.confirm("Apakah Anda yakin ingin membatalkan trajectory ini dan mengembalikan capaian kinerja ke awal?")) {
                                    handleResetTrajectory(node.agreement.id, rootId);
                                  }
                                }}
                                className="text-[9px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1"
                                title="Reset/Batalkan Trajectory"
                              >
                                <RotateCcw className="w-2.5 h-2.5" /> Batalkan Trajectory
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5">
                          {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'].map((month, mIdx) => {
                            const traj = getSafeTrajectory(node.root);
                            const val = traj[mIdx];
                            const achievements = getSafeMonthlyAchievements(node.root);
                            const realVal = achievements[mIdx];

                            return (
                              <div key={month} className="bg-white p-1.5 rounded-xl border border-slate-200 text-center space-y-1 shadow-xs hover:border-indigo-200 transition-colors">
                                <span className="text-[9px] font-black text-slate-400 font-mono uppercase tracking-wider block">{month}</span>
                                
                                <div className="space-y-0.5">
                                  <span className="text-[7px] text-slate-400 font-mono block leading-none">TARGET</span>
                                  <input
                                    type="number"
                                    value={val}
                                    onChange={(e) => handleUpdateTrajectory(node.agreement.id, rootId, mIdx, parseFloat(e.target.value) || 0)}
                                    disabled={!canEditAgreement('Kepala Stasiun')}
                                    className="w-full text-center font-black text-slate-800 text-[10px] bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-100 p-0.5 rounded"
                                  />
                                </div>

                                <div className="space-y-0.5">
                                  <span className="text-[7px] text-slate-400 font-mono block leading-none">REALISASI</span>
                                  <input
                                    type="number"
                                    value={realVal}
                                    onChange={(e) => handleUpdateMonthlyAchievement(node.agreement.id, rootId, mIdx, parseFloat(e.target.value) || 0)}
                                    disabled={!canEditAgreement('Kepala Stasiun')}
                                    className="w-full text-center font-black text-indigo-600 text-[10px] bg-indigo-50/20 hover:bg-indigo-50 focus:bg-white border border-indigo-100/50 p-0.5 rounded"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Children Cascading Section (Level 2 & 3) */}
                    {isExpanded && (
                      <div className="p-4 bg-slate-50/20 divide-y divide-slate-100">
                        {node.level2.length === 0 ? (
                          <div className="py-6 text-center text-slate-400 italic text-[11px] bg-white rounded-xl border border-dashed border-slate-100">
                            Belum ada delegasi ke level 2 (Kabag/Ketua Tim). Klik tombol "Delegasikan" untuk memecah target ini.
                          </div>
                        ) : (
                          node.level2.map((l2) => {
                            const l2Id = l2.indicator.id;
                            const isL2Expanded = !!expandedIndicators[l2Id];
                            const l2Score = getIndicatorScore(l2.indicator);

                            return (
                              <div key={l2Id} className="py-3.5 pl-6 pr-2">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-150/60 shadow-xs relative">
                                  
                                  {/* Visual cascade trace line */}
                                  <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-px bg-indigo-200" />
                                  <div className="absolute -left-6 top-0 bottom-1/2 w-px bg-indigo-200" />

                                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                    <button 
                                      onClick={() => toggleExpandIndicator(l2Id)}
                                      className="mt-0.5 p-0.5 hover:bg-slate-100 text-slate-400 rounded-md shrink-0"
                                    >
                                      {isL2Expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                    </button>

                                    <div className="space-y-0.5 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-extrabold uppercase rounded border border-blue-200">
                                          LEVEL 2 • {l2.agreement.level.toUpperCase()}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-mono">Parent ID: {l2.indicator.parentIndicatorId}</span>
                                        
                                        {/* Reordering Controls for Level 2 */}
                                        {canEditAgreement(l2.agreement.level) && (
                                          <div className="flex items-center gap-1 ml-2 bg-slate-100 rounded p-0.5">
                                            <button
                                              onClick={() => handleMoveObjective(l2.agreement.id, l2Id, 'up')}
                                              className="p-0.5 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                                              title="Pindahkan ke Atas"
                                            >
                                              <ArrowUp className="w-2.5 h-2.5" />
                                            </button>
                                            <button
                                              onClick={() => handleMoveObjective(l2.agreement.id, l2Id, 'down')}
                                              className="p-0.5 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                                              title="Pindahkan ke Bawah"
                                            >
                                              <ArrowDown className="w-2.5 h-2.5" />
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      {renamingIndicatorId === l2Id ? (
                                        <div className="flex items-center gap-2 mt-1">
                                          <input
                                            type="text"
                                            value={renamingNameValue}
                                            onChange={(e) => setRenamingNameValue(e.target.value)}
                                            className="flex-1 text-xs bg-white border border-indigo-400 rounded-lg px-2 py-1 font-medium text-slate-800 focus:outline-hidden"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveRename(l2.agreement.id, l2Id);
                                              if (e.key === 'Escape') setRenamingIndicatorId(null);
                                            }}
                                          />
                                          <button
                                            onClick={() => handleSaveRename(l2.agreement.id, l2Id)}
                                            className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
                                            title="Simpan"
                                          >
                                            <Check className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={() => setRenamingIndicatorId(null)}
                                            className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded transition-colors"
                                            title="Batal"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5 group">
                                          <h5 className="text-xs font-bold text-slate-700 leading-normal">{l2.indicator.indicatorName}</h5>
                                          {canEditAgreement(l2.agreement.level) && (
                                            <button
                                              onClick={() => {
                                                setRenamingIndicatorId(l2Id);
                                                setRenamingNameValue(l2.indicator.indicatorName);
                                              }}
                                              className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-slate-100 text-slate-400 rounded transition-all"
                                              title="Ubah Nama PK"
                                            >
                                              <Edit2 className="w-2.5 h-2.5" />
                                            </button>
                                          )}
                                        </div>
                                      )}
                                      <p className="text-[10px] text-slate-400">Penerima Delegasi: <span className="font-extrabold text-indigo-600">{l2.agreement.assignedToName}</span></p>
                                    </div>
                                  </div>

                                  {/* Right values */}
                                  <div className="flex items-center flex-wrap gap-3 text-xs">
                                    <div className="bg-slate-50 border border-slate-150 rounded-lg px-2 py-0.5 text-center">
                                      <span className="text-[8px] text-slate-400 block font-mono leading-none">TARGET</span>
                                      <div className="flex items-center gap-1">
                                        <input 
                                          type="text"
                                          value={l2.indicator.target}
                                          onChange={(e) => handleUpdateTarget(l2.agreement.id, l2Id, e.target.value)}
                                          disabled={!canEditAgreement(l2.agreement.level)}
                                          className="w-14 bg-white border border-slate-200 rounded px-1 py-0 text-center font-bold text-slate-800 text-[10px] focus:outline-hidden disabled:opacity-60"
                                        />
                                        <span className="text-[9px] text-slate-400 font-extrabold">{l2.indicator.unit}</span>
                                      </div>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-150 rounded-lg px-2 py-0.5 text-center">
                                      <span className="text-[8px] text-slate-400 block font-mono leading-none">REALISASI</span>
                                      <div className="flex items-center gap-1">
                                        <input 
                                          type="number"
                                          value={l2.indicator.achievement}
                                          onChange={(e) => handleUpdateAchievement(l2.agreement.id, l2Id, parseFloat(e.target.value) || 0)}
                                          disabled={!canEditAgreement(l2.agreement.level)}
                                          className="w-11 bg-white border border-slate-200 rounded px-1 py-0 text-center font-bold text-slate-800 text-[10px] focus:outline-hidden disabled:opacity-60 disabled:cursor-not-allowed"
                                        />
                                      </div>
                                    </div>

                                    <div className="text-center min-w-[40px]">
                                      <span className="text-[8px] text-slate-400 block font-mono leading-none">CAPAIAN</span>
                                      <span className={`font-bold text-[11px] ${
                                        l2Score >= 100 ? 'text-emerald-600' : 'text-indigo-600'
                                      }`}>{l2Score}%</span>
                                    </div>

                                    {/* Level 2 Trajectory Trigger Button */}
                                    <div>
                                      <button
                                        onClick={() => setExpandedTrajectoryId(expandedTrajectoryId === l2Id ? null : l2Id)}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all text-[9px] font-bold uppercase tracking-wider ${
                                          expandedTrajectoryId === l2Id 
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-indigo-600'
                                        }`}
                                        title="Atur Proyeksi Trajectory Target Bulanan"
                                      >
                                        <TrendingUp className="w-3 h-3" />
                                        Trajectory {l2.indicator.trajectory ? '✓' : ''}
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-1 border-l border-slate-150 pl-3">
                                      {canEditAgreement('Pegawai') && (
                                        <button
                                          onClick={() => openDelegation(l2.indicator, l2.agreement)}
                                          className="flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[9px] font-black rounded-md uppercase tracking-wide transition-colors"
                                          title="Delegasikan target ini kepada Staf Pegawai pelaksana langsung"
                                        >
                                          <Send className="w-2.5 h-2.5" /> Delegasi Staf
                                        </button>
                                      )}
                                      {canEditAgreement(l2.agreement.level) && (
                                        <button
                                          onClick={() => handleDeleteIndicator(l2.agreement.id, l2Id)}
                                          className="p-1 hover:bg-rose-50 text-rose-500 rounded-md"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                </div>

                                {/* Level 2 Trajectory Panel */}
                                {expandedTrajectoryId === l2Id && (
                                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5 my-2.5 relative shadow-inner">
                                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-px bg-indigo-200" />
                                    
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
                                      <div className="flex items-center gap-1.5">
                                        <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 font-mono">
                                          Trajectory & Realisasi Bulanan (Level 2)
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center gap-3 flex-wrap">
                                        {/* Trajectory Type Selector */}
                                        <div className="flex items-center gap-1">
                                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Model:</span>
                                          <select
                                            value={l2.indicator.trajectoryType || (l2.indicator.unit === '%' ? 'constant' : 'cumulative')}
                                            onChange={(e) => handleUpdateTrajectoryType(l2.agreement.id, l2Id, e.target.value as 'cumulative' | 'constant')}
                                            className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[9px] font-extrabold text-slate-700 focus:outline-hidden"
                                          >
                                            <option value="cumulative">Akumulatif (Penjumlahan)</option>
                                            <option value="constant">Konstan / Rata-rata (e.g. IKPA 100%)</option>
                                          </select>
                                        </div>

                                        {/* Calculation Type Selector */}
                                        <div className="flex items-center gap-1">
                                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Sumber Capaian:</span>
                                          <select
                                            value={l2.indicator.calculationType || 'automatic'}
                                            onChange={(e) => handleUpdateCalculationType(l2.agreement.id, l2Id, e.target.value as 'automatic' | 'manual')}
                                            className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[9px] font-extrabold text-indigo-600 focus:outline-hidden"
                                          >
                                            <option value="automatic">Otomatis Cascading (Staf)</option>
                                            <option value="manual">Intervensi Manual (Input Langsung)</option>
                                          </select>
                                        </div>

                                        {/* Evaluation Frequency Selector */}
                                        <div className="flex items-center gap-1">
                                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Frekuensi Capaian:</span>
                                          <select
                                            value={l2.indicator.periodType || 'tahunan'}
                                            onChange={(e) => handleUpdatePeriodType(l2.agreement.id, l2Id, e.target.value as 'tahunan' | 'triwulanan' | 'semesteran')}
                                            className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[9px] font-extrabold text-slate-700 focus:outline-hidden"
                                          >
                                            <option value="tahunan">Tahunan / Bulanan</option>
                                            <option value="triwulanan">Triwulanan (Quarterly)</option>
                                            <option value="semesteran">Semesteran (Semesterly)</option>
                                          </select>
                                        </div>

                                        <button
                                          onClick={() => {
                                            const targetNum = parseFloat(l2.indicator.target) || 0;
                                            const type = l2.indicator.trajectoryType || (l2.indicator.unit === '%' ? 'constant' : 'cumulative');
                                            const share = Math.round((targetNum / 12) * 10) / 10;
                                            const distrib = Array(12).fill(type === 'constant' ? targetNum : share);
                                            
                                            const updated = agreements.map(ag => {
                                              if (ag.id === l2.agreement.id) {
                                                return {
                                                  ...ag,
                                                  objectives: ag.objectives.map(o => o.id === l2Id ? { ...o, trajectory: distrib } : o)
                                                };
                                              }
                                              return ag;
                                            });
                                            onUpdateAgreements(updated);
                                          }}
                                          className="text-[8px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200"
                                        >
                                          Bagi Rata Target
                                        </button>
                                        {l2.indicator.trajectory && (
                                          <button
                                            onClick={() => {
                                              if (window.confirm("Apakah Anda yakin ingin membatalkan trajectory ini dan mengembalikan capaian kinerja ke awal?")) {
                                                handleResetTrajectory(l2.agreement.id, l2Id);
                                              }
                                            }}
                                            className="text-[8px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200 flex items-center gap-1"
                                            title="Reset/Batalkan Trajectory"
                                          >
                                            <RotateCcw className="w-2.5 h-2.5" /> Batalkan Trajectory
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5">
                                      {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'].map((month, mIdx) => {
                                        const traj = getSafeTrajectory(l2.indicator);
                                        const val = traj[mIdx];
                                        const achievements = getSafeMonthlyAchievements(l2.indicator);
                                        const realVal = achievements[mIdx];

                                        return (
                                          <div key={month} className="bg-white p-1.5 rounded-xl border border-slate-200 text-center space-y-1 shadow-xs hover:border-indigo-200 transition-colors">
                                            <span className="text-[9px] font-black text-slate-400 font-mono uppercase tracking-wider block">{month}</span>
                                            
                                            <div className="space-y-0.5">
                                              <span className="text-[7px] text-slate-400 font-mono block leading-none">TARGET</span>
                                              <input
                                                type="number"
                                                value={val}
                                                onChange={(e) => handleUpdateTrajectory(l2.agreement.id, l2Id, mIdx, parseFloat(e.target.value) || 0)}
                                                disabled={!canEditAgreement(l2.agreement.level)}
                                                className="w-full text-center font-black text-slate-800 text-[10px] bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-100 p-0.5 rounded"
                                              />
                                            </div>

                                            <div className="space-y-0.5">
                                              <span className="text-[7px] text-slate-400 font-mono block leading-none">REALISASI</span>
                                              <input
                                                type="number"
                                                value={realVal}
                                                onChange={(e) => handleUpdateMonthlyAchievement(l2.agreement.id, l2Id, mIdx, parseFloat(e.target.value) || 0)}
                                                disabled={!canEditAgreement(l2.agreement.level)}
                                                className="w-full text-center font-black text-indigo-600 text-[10px] bg-indigo-50/20 hover:bg-indigo-50 focus:bg-white border border-indigo-100/50 p-0.5 rounded"
                                              />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Level 3 - Pegawai Individual Target */}
                                {isL2Expanded && (
                                  <div className="mt-2 space-y-2 pl-8 border-l border-dashed border-indigo-200">
                                    {l2.children.length === 0 ? (
                                      <div className="py-3 text-center text-slate-400 italic text-[10px] bg-white rounded-lg border border-slate-100">
                                        Belum ada delegasi ke staf pegawai pelaksana langsung.
                                      </div>
                                    ) : (
                                      l2.children.map((l3) => {
                                        const l3Id = l3.indicator.id;
                                        const l3Score = getIndicatorScore(l3.indicator);

                                        return (
                                          <div key={l3Id} className="w-full space-y-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50/20 p-2.5 rounded-lg border border-emerald-100/50 text-xs relative">
                                            
                                            {/* Visual cascade horizontal connector */}
                                            <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-px bg-indigo-100 border-dashed border-t" />

                                            <div className="space-y-0.5">
                                              <div className="flex items-center gap-1">
                                                <span className="px-1 py-0.2 bg-emerald-100 text-emerald-700 text-[8px] font-extrabold uppercase rounded">
                                                  LEVEL 3 • SASARAN PEGAWAI
                                                </span>
                                                <span className="text-[8px] text-slate-400 font-mono">Parent: {l3.indicator.parentIndicatorId}</span>
                                              </div>
                                              {/* Reordering Controls for Level 3 */}
                                              {canEditAgreement('Pegawai') && (
                                                <div className="flex items-center gap-1 mb-1.5 bg-slate-100 rounded p-0.5 w-fit">
                                                  <button
                                                    onClick={() => handleMoveObjective(l3.agreement.id, l3Id, 'up')}
                                                    className="p-0.5 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                                                    title="Pindahkan ke Atas"
                                                  >
                                                    <ArrowUp className="w-2.5 h-2.5" />
                                                  </button>
                                                  <button
                                                    onClick={() => handleMoveObjective(l3.agreement.id, l3Id, 'down')}
                                                    className="p-0.5 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                                                    title="Pindahkan ke Bawah"
                                                  >
                                                    <ArrowDown className="w-2.5 h-2.5" />
                                                  </button>
                                                </div>
                                              )}

                                              {renamingIndicatorId === l3Id ? (
                                                <div className="flex items-center gap-2 mt-1">
                                                  <input
                                                    type="text"
                                                    value={renamingNameValue}
                                                    onChange={(e) => setRenamingNameValue(e.target.value)}
                                                    className="flex-1 text-xs bg-white border border-indigo-400 rounded-lg px-2 py-0.5 font-medium text-slate-800 focus:outline-hidden"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                      if (e.key === 'Enter') handleSaveRename(l3.agreement.id, l3Id);
                                                      if (e.key === 'Escape') setRenamingIndicatorId(null);
                                                    }}
                                                  />
                                                  <button
                                                    onClick={() => handleSaveRename(l3.agreement.id, l3Id)}
                                                    className="p-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
                                                    title="Simpan"
                                                  >
                                                    <Check className="w-2.5 h-2.5" />
                                                  </button>
                                                  <button
                                                    onClick={() => setRenamingIndicatorId(null)}
                                                    className="p-0.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded transition-colors"
                                                    title="Batal"
                                                  >
                                                    <X className="w-2.5 h-2.5" />
                                                  </button>
                                                </div>
                                              ) : (
                                                <div className="flex items-center gap-1.5 group">
                                                  <h6 className="font-semibold text-slate-700">{l3.indicator.indicatorName}</h6>
                                                  {canEditAgreement('Pegawai') && (
                                                    <button
                                                      onClick={() => {
                                                        setRenamingIndicatorId(l3Id);
                                                        setRenamingNameValue(l3.indicator.indicatorName);
                                                      }}
                                                      className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-slate-100 text-slate-400 rounded transition-all"
                                                      title="Ubah Nama PK"
                                                    >
                                                      <Edit2 className="w-2.5 h-2.5" />
                                                    </button>
                                                  )}
                                                </div>
                                              )}
                                              <p className="text-[10px] text-slate-400">Pegawai Pelaksana: <span className="font-extrabold text-emerald-600">{l3.agreement.assignedToName}</span></p>
                                            </div>

                                            {/* Level 3 right values */}
                                            <div className="flex items-center gap-3">
                                              <div className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center">
                                                <span className="text-[7px] text-slate-400 block font-mono leading-none">TARGET</span>
                                                <div className="flex items-center gap-1">
                                                  <input 
                                                    type="text"
                                                    value={l3.indicator.target}
                                                    onChange={(e) => handleUpdateTarget(l3.agreement.id, l3Id, e.target.value)}
                                                    disabled={!canEditAgreement('Pegawai')}
                                                    className="w-12 bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-center font-bold text-slate-800 text-[10px] focus:outline-hidden disabled:opacity-60"
                                                  />
                                                  <span className="text-[8px] text-slate-400 font-extrabold">{l3.indicator.unit}</span>
                                                </div>
                                              </div>

                                              <div className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center">
                                                <span className="text-[7px] text-slate-400 block font-mono leading-none">REALISASI</span>
                                                <input 
                                                  type="number"
                                                  value={l3.indicator.achievement}
                                                  onChange={(e) => handleUpdateAchievement(l3.agreement.id, l3Id, parseFloat(e.target.value) || 0)}
                                                  disabled={!canEditAgreement('Pegawai')}
                                                  className="w-10 bg-slate-50 border border-slate-200 rounded px-1 py-0 text-center font-bold text-slate-800 text-[9px] focus:outline-hidden disabled:opacity-60 disabled:cursor-not-allowed"
                                                />
                                              </div>

                                              <div className="text-center">
                                                <span className="text-[7px] text-slate-400 block font-mono leading-none">CAPAIAN</span>
                                                <span className="font-black text-emerald-600 text-[10px]">{l3Score}%</span>
                                              </div>

                                              {/* Level 3 Trajectory Trigger Button */}
                                              <div>
                                                <button
                                                  onClick={() => setExpandedTrajectoryId(expandedTrajectoryId === l3Id ? null : l3Id)}
                                                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-all text-[8px] font-bold uppercase tracking-wider ${
                                                    expandedTrajectoryId === l3Id 
                                                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                                                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-indigo-600'
                                                  }`}
                                                  title="Atur Proyeksi Trajectory Target Bulanan"
                                                >
                                                  <TrendingUp className="w-2.5 h-2.5" />
                                                  Trajectory {l3.indicator.trajectory ? '✓' : ''}
                                                </button>
                                              </div>

                                              {canEditAgreement('Pegawai') && (
                                                <button
                                                  onClick={() => handleDeleteIndicator(l3.agreement.id, l3Id)}
                                                  className="p-1 hover:bg-rose-50 text-rose-500 rounded"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                              )}
                                            </div>
                                          </div>

                                            {/* Level 3 Trajectory Panel */}
                                            {expandedTrajectoryId === l3Id && (
                                              <div className="w-full mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-inner text-xs">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-1.5 border-b border-slate-200/60">
                                                  <div className="flex items-center gap-1.5">
                                                    <TrendingUp className="w-3 h-3 text-indigo-500" />
                                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-600 font-mono">
                                                      Trajectory & Realisasi Bulanan (Level 3)
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center gap-2 flex-wrap">
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">Model:</span>
                                                      <select
                                                        value={l3.indicator.trajectoryType || (l3.indicator.unit === '%' ? 'constant' : 'cumulative')}
                                                        onChange={(e) => handleUpdateTrajectoryType(l3.agreement.id, l3Id, e.target.value as 'cumulative' | 'constant')}
                                                        className="bg-white border border-slate-200 rounded px-1 py-0.5 text-[8px] font-extrabold text-slate-700 focus:outline-hidden"
                                                      >
                                                        <option value="cumulative">Akumulatif (Penjumlahan)</option>
                                                        <option value="constant">Konstan / Rata-rata (e.g. IKPA 100%)</option>
                                                      </select>
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">Frekuensi:</span>
                                                      <select
                                                        value={l3.indicator.periodType || 'tahunan'}
                                                        onChange={(e) => handleUpdatePeriodType(l3.agreement.id, l3Id, e.target.value as 'tahunan' | 'triwulanan' | 'semesteran')}
                                                        className="bg-white border border-slate-200 rounded px-1 py-0.5 text-[8px] font-extrabold text-slate-700 focus:outline-hidden"
                                                      >
                                                        <option value="tahunan">Tahunan / Bulanan</option>
                                                        <option value="triwulanan">Triwulanan</option>
                                                        <option value="semesteran">Semesteran</option>
                                                      </select>
                                                    </div>
                                                    <button
                                                      onClick={() => {
                                                        const targetNum = parseFloat(l3.indicator.target) || 0;
                                                        const type = l3.indicator.trajectoryType || (l3.indicator.unit === '%' ? 'constant' : 'cumulative');
                                                        const share = Math.round((targetNum / 12) * 10) / 10;
                                                        const distrib = Array(12).fill(type === 'constant' ? targetNum : share);
                                                        
                                                        const updated = agreements.map(ag => {
                                                          if (ag.id === l3.agreement.id) {
                                                            return {
                                                              ...ag,
                                                              objectives: ag.objectives.map(o => o.id === l3Id ? { ...o, trajectory: distrib } : o)
                                                            };
                                                          }
                                                          return ag;
                                                        });
                                                        onUpdateAgreements(updated);
                                                      }}
                                                      className="text-[8px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200"
                                                    >
                                                      Bagi Rata Target
                                                    </button>
                                                    {l3.indicator.trajectory && (
                                                      <button
                                                        onClick={() => {
                                                          if (window.confirm("Apakah Anda yakin ingin membatalkan trajectory ini dan mengembalikan capaian kinerja ke awal?")) {
                                                            handleResetTrajectory(l3.agreement.id, l3Id);
                                                          }
                                                        }}
                                                        className="text-[8px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200 flex items-center gap-1"
                                                        title="Reset/Batalkan Trajectory"
                                                      >
                                                        <RotateCcw className="w-2.5 h-2.5" /> Batalkan Trajectory
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5">
                                                  {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'].map((month, mIdx) => {
                                                    const traj = getSafeTrajectory(l3.indicator);
                                                    const val = traj[mIdx];
                                                    const achievements = getSafeMonthlyAchievements(l3.indicator);
                                                    const realVal = achievements[mIdx];
                                                    return (
                                                      <div key={month} className="bg-white p-1.5 rounded-xl border border-slate-200 text-center space-y-1 shadow-xs hover:border-indigo-200 transition-colors">
                                                        <span className="text-[9px] font-black text-slate-400 font-mono uppercase tracking-wider block">{month}</span>
                                                        
                                                        <div className="space-y-0.5">
                                                          <span className="text-[7px] text-slate-400 font-mono block leading-none">TARGET</span>
                                                          <input
                                                            type="number"
                                                            value={val}
                                                            onChange={(e) => handleUpdateTrajectory(l3.agreement.id, l3Id, mIdx, parseFloat(e.target.value) || 0)}
                                                            disabled={!canEditAgreement('Pegawai')}
                                                            className="w-full text-center font-black text-slate-800 text-[10px] bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-100 p-0.5 rounded"
                                                          />
                                                        </div>

                                                        <div className="space-y-0.5">
                                                          <span className="text-[7px] text-slate-400 font-mono block leading-none">REALISASI</span>
                                                          <input
                                                            type="number"
                                                            value={realVal}
                                                            onChange={(e) => handleUpdateMonthlyAchievement(l3.agreement.id, l3Id, mIdx, parseFloat(e.target.value) || 0)}
                                                            disabled={!canEditAgreement('Pegawai')}
                                                            className="w-full text-center font-black text-indigo-600 text-[10px] bg-indigo-50/20 hover:bg-indigo-50 focus:bg-white border border-indigo-100/50 p-0.5 rounded"
                                                          />
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}

                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                )}

                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>

        </div>
      ) : (
        // New Evaluasi Berkala Tab
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  Evaluasi Capaian Kinerja Berkala (Cascading IKP)
                </h3>
                <p className="text-[11px] text-slate-400">Analisis pencapaian Sasaran Strategis Pimpinan dan turunannya secara bertahap (Triwulan, Semester, dan Tahunan).</p>
              </div>

              {/* Print Button */}
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors self-start"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak Laporan
              </button>
            </div>

            {/* Controls panel */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Period pills selector */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">Pilih Periode Evaluasi:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'q1', label: 'Triwulan I (Jan-Mar)' },
                      { id: 'q2', label: 'Triwulan II (Apr-Jun)' },
                      { id: 'q3', label: 'Triwulan III (Jul-Sep)' },
                      { id: 'q4', label: 'Triwulan IV (Okt-Des)' },
                      { id: 's1', label: 'Semester I (Jan-Jun)' },
                      { id: 's2', label: 'Semester II (Jul-Des)' },
                      { id: 'tahunan', label: 'Tahunan (Full)' }
                    ].map(p => (
                      <button
                        key={p.id}
                        onClick={() => setEvalPeriod(p.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          evalPeriod === p.id 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scaling Toggle */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <input
                    type="checkbox"
                    id="scaleTargetsCheckbox"
                    checked={scaleTargets}
                    onChange={(e) => setScaleTargets(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded-sm focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="scaleTargetsCheckbox" className="select-none cursor-pointer">
                    <span className="text-xs font-bold text-slate-700 block">Skalakan Target Secara Proporsional</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Misal: Target Triwulan dihitung 25% dari target tahunan</span>
                  </label>
                </div>

              </div>
            </div>

            {/* Periodic mini-stats */}
            {(() => {
              // Calculate specific period stats
              let countIndicators = 0;
              let scoreSum = 0;
              
              periodAgreements.forEach(a => {
                a.objectives.forEach(obj => {
                  countIndicators++;
                  const targetVal = obj._scaledTargetVal !== undefined ? obj._scaledTargetVal : (parseFloat(obj.target) || 100);
                  const real = obj.achievement || 0;
                  const score = targetVal > 0 ? Math.min(120, Math.round((real / targetVal) * 100)) : 0;
                  scoreSum += score;
                });
              });

              const periodAvgScore = countIndicators > 0 ? Math.round(scoreSum / countIndicators) : 0;
              const filteredReportsCount = newsReports.filter(r => isReportInPeriod(r, evalPeriod, selectedYear)).length;
              const filteredPnbpAmount = contracts
                .filter(c => isContractInPeriod(c, evalPeriod, selectedYear) && c.linkedIndicatorId === 'ind-11')
                .reduce((sum, c) => sum + c.realizedPnbp, 0);

              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase font-mono leading-none">Rata Capaian Periodik</p>
                      <p className="text-sm font-black text-slate-800 mt-1 leading-none">{periodAvgScore}%</p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase font-mono leading-none">Total IKP Terbaca</p>
                      <p className="text-sm font-black text-slate-800 mt-1 leading-none">{countIndicators} Indikator</p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase font-mono leading-none">Produksi Berita/Konten</p>
                      <p className="text-sm font-black text-slate-800 mt-1 leading-none">{filteredReportsCount} Konten</p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase font-mono leading-none">PNBP Terkumpul</p>
                      <p className="text-sm font-black text-slate-800 mt-1 leading-none">{filteredPnbpAmount} Juta</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Hierarchical Cascading Table / List */}
            <div className="space-y-6">
              {(() => {
                const kepalaAg = periodAgreements.find(a => a.level === 'Kepala Stasiun');
                
                if (!kepalaAg || kepalaAg.objectives.length === 0) {
                  return (
                    <div className="p-12 text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                      <Award className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
                      <p className="text-xs font-bold text-slate-500">Belum ada target pimpinan atau Perjanjian Kinerja terdefinisi.</p>
                      <p className="text-[10px] text-slate-400 mt-1">Gunakan Pohon Kinerja untuk mengonfigurasi sasaran strategis Kepala Stasiun terlebih dahulu.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-5">
                    {kepalaAg.objectives.map((rootObj) => {
                      const rootScore = getIndicatorScore(rootObj);
                      const rootReal = rootObj.achievement || 0;
                      
                      // Find Level 2 descendants for this Level 1 objective
                      const level2Objects = periodAgreements
                        .filter(a => a.level !== 'Kepala Stasiun' && a.level !== 'Pegawai')
                        .flatMap(a => 
                          a.objectives
                            .filter(obj => obj.parentIndicatorId === rootObj.id)
                            .map(obj => ({ indicator: obj, agreement: a }))
                        );

                      return (
                        <div key={rootObj.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:border-indigo-300 transition-colors">
                          
                          {/* Level 1: Kepala Stasiun Card Header */}
                          <div className="p-5 bg-gradient-to-r from-indigo-50/50 to-purple-50/20 border-b border-slate-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1.5 flex-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-indigo-100 text-indigo-800 border border-indigo-200 font-mono tracking-wide">
                                IKP PIMPINAN (LEVEL 1)
                              </span>
                              <h4 className="text-xs font-bold text-slate-800 leading-relaxed">{rootObj.indicatorName}</h4>
                              <p className="text-[10px] text-slate-400 flex items-center gap-2">
                                <span>Target: <span className="font-extrabold text-slate-700">{rootObj._scaledTargetString || rootObj.target} {rootObj.unit}</span></span>
                                <span>•</span>
                                <span>Realisasi: <span className="font-extrabold text-indigo-600">{rootReal} {rootObj.unit}</span></span>
                                <span>•</span>
                                <span>Bobot: <span className="font-extrabold text-purple-600">{rootObj.weight}%</span></span>
                              </p>
                            </div>

                            {/* Circular/Badge Score Progress */}
                            <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
                              <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    rootScore >= 90 ? 'bg-emerald-500' : rootScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(100, rootScore)}%` }}
                                />
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider font-mono shrink-0 ${
                                rootScore >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                rootScore >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {rootScore}% Capaian
                              </span>
                            </div>
                          </div>

                          {/* Level 1 Catatan Evaluasi & Feedback */}
                          <div className="px-5 py-2 border-b border-slate-100 bg-white">
                            <IndicatorCommentsSection
                              agreementId={kepalaAg.id}
                              indicator={rootObj}
                              currentUser={currentUser}
                              onAddComment={handleAddComment}
                              onDeleteComment={handleDeleteComment}
                            />
                          </div>

                          {/* Level 2: Ketua Tim / Kabid Descendants */}
                          <div className="p-4 bg-slate-50/30 space-y-4">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                              <GitFork className="w-3 h-3 text-indigo-400" />
                              Pendelegasian & Cascading Turunannya (Level 2 & 3)
                            </h5>

                            {level2Objects.length === 0 ? (
                              <p className="text-[11px] text-slate-400 italic pl-4">Belum ada delegasi indikator ke Level 2 (Ketua Tim / Kabag TU) yang berkorelasi.</p>
                            ) : (
                              <div className="space-y-3 pl-3 border-l border-indigo-100">
                                {level2Objects.map(({ indicator: l2Obj, agreement: l2Ag }) => {
                                  const l2Score = getIndicatorScore(l2Obj);
                                  const l2Real = l2Obj.achievement || 0;

                                  // Find Level 3 descendants (Pegawai under this Level 2 indicator)
                                  const level3Objects = periodAgreements
                                    .filter(a => a.level === 'Pegawai')
                                    .flatMap(a => 
                                      a.objectives
                                        .filter(obj => obj.parentIndicatorId === l2Obj.id)
                                        .map(obj => ({ indicator: obj, agreement: a }))
                                    );

                                  return (
                                    <div key={l2Obj.id} className="bg-white rounded-xl border border-slate-150 overflow-hidden shadow-xs">
                                      
                                      {/* Level 2 info row */}
                                      <div className="p-3 bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-150">
                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-blue-100 text-blue-800 tracking-wider">
                                              LEVEL 2
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-extrabold truncate">
                                              {l2Ag.assignedToName} ({l2Ag.level})
                                            </span>
                                          </div>
                                          <p className="text-xs font-bold text-slate-700 leading-normal mt-1">{l2Obj.indicatorName}</p>
                                          
                                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                                            <span>Target: <span className="font-extrabold text-slate-600">{l2Obj._scaledTargetString || l2Obj.target} {l2Obj.unit}</span></span>
                                            <span>•</span>
                                            <span>Realisasi: <span className="font-extrabold text-indigo-600">{l2Real} {l2Obj.unit}</span></span>
                                            <span>•</span>
                                            <span>Bobot: <span className="font-extrabold text-indigo-500">{l2Obj.weight}%</span></span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border shrink-0 font-mono ${
                                            l2Score >= 90 ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200' : 
                                            l2Score >= 50 ? 'bg-amber-50/80 text-amber-700 border-amber-200' : 
                                            'bg-rose-50/80 text-rose-700 border-rose-200'
                                          }`}>
                                            {l2Score}% Capaian
                                          </span>
                                        </div>
                                      </div>

                                      {/* Level 3 Pegawai row list */}
                                      {level3Objects.length > 0 && (
                                        <div className="p-2.5 bg-slate-100/30 border-t border-slate-100">
                                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 pl-1">Kontributor Kinerja Pelaksana (Level 3 - Pegawai):</span>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {level3Objects.map(({ indicator: l3Obj, agreement: l3Ag }) => {
                                              const l3Score = getIndicatorScore(l3Obj);
                                              const l3Real = l3Obj.achievement || 0;

                                              return (
                                                <div key={l3Obj.id} className="bg-white p-3 rounded-lg border border-slate-150 flex flex-col justify-between gap-2.5 text-[11px] shadow-2xs hover:border-blue-200 transition-colors">
                                                  <div className="flex items-start justify-between gap-2 w-full">
                                                    <div className="min-w-0 flex-1">
                                                      <div className="flex items-center gap-1.5">
                                                        <User className="w-3 h-3 text-slate-400" />
                                                        <span className="font-extrabold text-slate-700 truncate">{l3Ag.assignedToName}</span>
                                                      </div>
                                                      <p className="text-[10px] text-slate-500 leading-tight truncate mt-0.5">{l3Obj.indicatorName}</p>
                                                      <div className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                                                        <span>Target: <span className="font-extrabold text-slate-500">{l3Obj._scaledTargetString || l3Obj.target} {l3Obj.unit}</span></span>
                                                        <span>•</span>
                                                        <span>Realisasi: <span className="font-extrabold text-indigo-600">{l3Real}</span></span>
                                                      </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                                      <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black font-mono shrink-0 ${l3Score >= 90 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : l3Score >= 50 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                                                        {l3Score}%
                                                      </span>
                                                    </div>
                                                  </div>

                                                  {/* Level 3 Comments */}
                                                  <IndicatorCommentsSection
                                                    agreementId={l3Ag.id}
                                                    indicator={l3Obj}
                                                    currentUser={currentUser}
                                                    onAddComment={handleAddComment}
                                                    onDeleteComment={handleDeleteComment}
                                                  />
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}

                                      {/* Level 2 Comments Section */}
                                      <div className="p-3 bg-white border-t border-slate-100">
                                        <IndicatorCommentsSection
                                          agreementId={l2Ag.id}
                                          indicator={l2Obj}
                                          currentUser={currentUser}
                                          onAddComment={handleAddComment}
                                          onDeleteComment={handleDeleteComment}
                                        />
                                      </div>

                                    </div>
                                  );
                                })}
                              </div>
                            )}

                          </div>

                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

          </div>
        </div>
      )}

      {/* SAKIP Expert Tab Removed */ false && (
        // Pakar SAKIP & ASN Tab
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Card */}
          <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-indigo-900 text-white p-6 rounded-3xl border border-amber-500/30 shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/20 backdrop-blur-md rounded-xl border border-amber-400/30">
                    <Brain className="w-6 h-6 text-amber-300 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-400/20 font-mono">Permenpan RB 6/2022</span>
                </div>
                <h3 className="text-xl font-black tracking-tight font-sans">Sistem Pakar SAKIP &amp; Manajemen Kinerja ASN</h3>
                <p className="text-xs text-amber-100/90 max-w-2xl leading-relaxed">
                  Asisten evaluasi taktis cerdas yang mensimulasikan nilai capaian SAKIP, mengkalkulasi predikat kinerja organisasi, menyelaraskan pembobotan kaskade tugas, serta menyusun draf laporan analisis LKE/LKjIP instansi secara otomatis.
                </p>
              </div>

              {/* Status Indicator */}
              <div className="bg-black/20 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3 self-start md:self-auto">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <div className="text-xs">
                  <p className="font-extrabold text-amber-300">Sistem Pakar Online</p>
                  <p className="text-[9px] text-white/60 font-mono">Versi 4.2 - Siap Analisis</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sidebar Controls: 5 cols */}
            <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-5 h-fit">
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider font-mono">Pusat Diagnosa Mandiri</h4>
                <p className="text-[10px] text-slate-400">Pilih sasaran kerja dari dokumen PK yang ada untuk dianalisis, atau tentukan parameter simulasi kustom Anda sendiri.</p>
              </div>

              <div className="space-y-4">
                {/* 1. Select target */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">1. Pilih Sasaran Kerja untuk Diperiksa:</label>
                  <select
                    value={simSelectedIndicatorId}
                    onChange={(e) => handleSelectIndicatorForSim(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="custom" className="font-bold text-slate-500">★ Custom / Ketik Manual Sendiri</option>
                    {allIndicatorsList.map(item => (
                      <option key={item.indicator.id} value={item.indicator.id}>
                        [{item.agreement.assignedToName} - {item.agreement.level}] {item.indicator.indicatorName.substring(0, 60)}...
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Custom Name (if manual) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Nama Indikator Kinerja Utama (IKU):</label>
                  <textarea
                    value={simCustomName}
                    onChange={(e) => {
                      setSimCustomName(e.target.value);
                      if (simSelectedIndicatorId !== 'custom') setSimSelectedIndicatorId('custom');
                    }}
                    placeholder="Ketik indikator sasaran di sini..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-400 h-16 resize-none"
                  />
                </div>

                {/* 3. Target and Realization controls */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Target Kinerja</label>
                    <input
                      type="number"
                      value={simTarget}
                      onChange={(e) => {
                        setSimTarget(parseFloat(e.target.value) || 0);
                        if (simSelectedIndicatorId !== 'custom') setSimSelectedIndicatorId('custom');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-center focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Realisasi Riil</label>
                    <input
                      type="number"
                      value={simRealization}
                      onChange={(e) => {
                        setSimRealization(parseFloat(e.target.value) || 0);
                        if (simSelectedIndicatorId !== 'custom') setSimSelectedIndicatorId('custom');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-center focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Satuan Ukur</label>
                    <input
                      type="text"
                      value={simUnit}
                      onChange={(e) => {
                        setSimUnit(e.target.value);
                        if (simSelectedIndicatorId !== 'custom') setSimSelectedIndicatorId('custom');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-center focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>

                {/* Slider for realization for direct interactive fun! */}
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                    <span>Geser Realisasi (Simulasi Interaktif):</span>
                    <span className="text-indigo-600 font-extrabold">{Math.round((simRealization / (simTarget || 1)) * 100)}% Capaian</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={simTarget * 1.2 || 120}
                    step={simTarget ? simTarget / 100 : 1}
                    value={simRealization}
                    onChange={(e) => {
                      setSimRealization(parseFloat(e.target.value));
                      if (simSelectedIndicatorId !== 'custom') setSimSelectedIndicatorId('custom');
                    }}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                  />
                  <p className="text-[9px] text-slate-400 text-center italic">Seret penggeser di atas untuk melihat predikat dan kalimat draf analisis terperinci berubah secara langsung!</p>
                </div>

                {/* 4. Level Organisasi */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Level Pertanggungjawaban:</label>
                  <div className="grid grid-cols-3 gap-1">
                    {['Kepala Stasiun', 'Kabid / Ketua Tim', 'Pegawai'].map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          setSimLevel(lvl);
                          if (simSelectedIndicatorId !== 'custom') setSimSelectedIndicatorId('custom');
                        }}
                        className={`py-2 px-1 rounded-xl text-[10px] font-extrabold text-center transition-all border ${
                          simLevel === lvl
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {lvl === 'Kabid / Ketua Tim' ? 'Level 2' : lvl === 'Pegawai' ? 'Level 3' : 'Level 1'}
                        <span className="block text-[8px] opacity-75 font-normal mt-0.5">{lvl}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Tema Bidang */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Tema Evaluasi / Klasifikasi Tugas:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'pnbp', label: 'PNBP / Kerjasama', desc: 'Sewa pemancar &amp; reklame' },
                      { id: 'berita', label: 'Berita / Konten', desc: 'Siaran, pemberitaan, medsos' },
                      { id: 'tu', label: 'Tata Usaha / Umum', desc: 'SDM, arsip, keuangan, TU' },
                      { id: 'umum', label: 'Lainnya / Umum', desc: 'Indikator strategis stasiun' }
                    ].map(theme => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          setSimTheme(theme.id as any);
                          if (simSelectedIndicatorId !== 'custom') setSimSelectedIndicatorId('custom');
                        }}
                        className={`p-2.5 rounded-xl text-left transition-all border flex flex-col justify-between ${
                          simTheme === theme.id
                            ? 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-200 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-[10.5px] font-black leading-tight">{theme.label}</p>
                        <p className={`text-[8.5px] leading-tight mt-0.5 ${simTheme === theme.id ? 'text-amber-700' : 'text-slate-400'}`}>{theme.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Diagnostic Center Outputs: 7 cols */}
            <div className="lg:col-span-7 space-y-6">
              
              {(() => {
                // RUN SAKIP CALCULATOR ENGINE
                const score = simTarget > 0 ? Math.min(120, Math.round((simRealization / simTarget) * 100)) : 0;
                
                // Calculate SAKIP Predicate
                let sakipPred = 'B';
                let sakipLabel = 'Baik';
                let sakipColor = 'text-indigo-600 bg-indigo-50 border-indigo-200';
                if (score >= 90) {
                  sakipPred = 'AA';
                  sakipLabel = 'Sangat Memuaskan';
                  sakipColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                } else if (score >= 80) {
                  sakipPred = 'A';
                  sakipLabel = 'Memuaskan';
                  sakipColor = 'text-teal-700 bg-teal-50 border-teal-200';
                } else if (score >= 70) {
                  sakipPred = 'BB';
                  sakipLabel = 'Sangat Baik';
                  sakipColor = 'text-blue-700 bg-blue-50 border-blue-200';
                } else if (score >= 60) {
                  sakipPred = 'B';
                  sakipLabel = 'Baik';
                  sakipColor = 'text-indigo-700 bg-indigo-50 border-indigo-200';
                } else if (score >= 50) {
                  sakipPred = 'CC';
                  sakipLabel = 'Cukup';
                  sakipColor = 'text-amber-700 bg-amber-50 border-amber-200';
                } else if (score >= 30) {
                  sakipPred = 'C';
                  sakipLabel = 'Kurang';
                  sakipColor = 'text-orange-700 bg-orange-50 border-orange-200';
                } else {
                  sakipPred = 'D';
                  sakipLabel = 'Sangat Kurang';
                  sakipColor = 'text-rose-700 bg-rose-50 border-rose-200';
                }

                // Calculate ASN Rating (Permenpan RB 6/2022)
                let asnRating = 'BAIK';
                let asnColor = 'bg-emerald-500';
                let asnBadgeColor = 'bg-emerald-50 border-emerald-200 text-emerald-800';
                let asnDesc = 'Hasil kerja sesuai ekspektasi pimpinan dan kontribusi organisasi tercapai secara optimal.';
                if (score >= 100) {
                  asnRating = 'SANGAT BAIK';
                  asnColor = 'bg-teal-600';
                  asnBadgeColor = 'bg-teal-50 border-teal-200 text-teal-800';
                  asnDesc = 'Hasil kerja secara konsisten melampaui ekspektasi pimpinan serta menginspirasi rekan kerja lainnya.';
                } else if (score >= 80) {
                  asnRating = 'BAIK';
                  asnColor = 'bg-emerald-500';
                  asnBadgeColor = 'bg-emerald-50 border-emerald-200 text-emerald-800';
                  asnDesc = 'Hasil kerja sesuai ekspektasi dan memberikan dampak positif langsung pada pencapaian target unit kerja.';
                } else if (score >= 70) {
                  asnRating = 'BUTUH PERBAIKAN';
                  asnColor = 'bg-amber-500';
                  asnBadgeColor = 'bg-amber-50 border-amber-200 text-amber-800';
                  asnDesc = 'Sebagian hasil kerja belum sepenuhnya memenuhi ekspektasi pimpinan, diperlukan penyesuaian strategi.';
                } else if (score >= 50) {
                  asnRating = 'KURANG';
                  asnColor = 'bg-orange-500';
                  asnBadgeColor = 'bg-orange-50 border-orange-200 text-orange-800';
                  asnDesc = 'Hasil kerja berada di bawah standar minimal ekspektasi pimpinan dan memerlukan pembinaan intensif.';
                } else {
                  asnRating = 'SANGAT KURANG';
                  asnColor = 'bg-rose-600';
                  asnBadgeColor = 'bg-rose-50 border-rose-200 text-rose-800';
                  asnDesc = 'Hasil kerja jauh di bawah ekspektasi pimpinan dan merugikan capaian akuntabilitas unit organisasi.';
                }

                // Dynamic Cascading division and weights
                let cascadingList: { level: string; role: string; weight: number; reason: string }[] = [];
                if (simLevel === 'Kepala Stasiun' || simLevel === 'Level 1') {
                  if (simTheme === 'pnbp') {
                    cascadingList = [
                      { level: 'Level 2', role: 'Ketua Tim Layanan Pengembangan Usaha', weight: 60, reason: 'Penanggung jawab utama pencarian mitra kerjasama dan penagihan piutang PNBP.' },
                      { level: 'Level 2', role: 'Ketua Tim Siaran', weight: 40, reason: 'Pemberi slot penyiaran / iklan layanan sebagai komoditas utama kerjasama.' }
                    ];
                  } else if (simTheme === 'berita') {
                    cascadingList = [
                      { level: 'Level 2', role: 'Ketua Tim Pemberitaan', weight: 50, reason: 'Bertanggung jawab atas produksi berita radio harian dan akurasi informasi redaksi.' },
                      { level: 'Level 2', role: 'Ketua Tim Konten Media Baru', weight: 30, reason: 'Bertanggung jawab atas diseminasi berita ke portal online dan infografis media sosial.' },
                      { level: 'Level 2', role: 'Ketua Tim Teknologi dan Media Baru', weight: 20, reason: 'Menyediakan infrastruktur streaming dan pemeliharaan server portal berita.' }
                    ];
                  } else {
                    cascadingList = [
                      { level: 'Level 2', role: 'Kepala Bagian Tata Usaha (Kabid)', weight: 40, reason: 'Mendukung fasilitasi anggaran operasional dan administrasi seluruh program kerja.' },
                      { level: 'Level 2', role: 'Seluruh Ketua Tim Kerja', weight: 60, reason: 'Pelaksana taktis sasaran strategis sesuai pembagian divisi fungsional.' }
                    ];
                  }
                } else {
                  // Cascading to Level 3 (Pegawai)
                  if (simTheme === 'pnbp') {
                    cascadingList = [
                      { level: 'Level 3', role: 'Staf Administrasi Kerjasama (PUPN)', weight: 50, reason: 'Melakukan penatausahaan kontrak mitra, rekonsiliasi billing, dan verifikasi setor kas negara.' },
                      { level: 'Level 3', role: 'Account Executive / Sales Staf', weight: 50, reason: 'Melakukan canvassing calon mitra, penyusunan proposal sewa aset, dan negosiasi tarif.' }
                    ];
                  } else if (simTheme === 'berita') {
                    cascadingList = [
                      { level: 'Level 3', role: 'Reporter Jurnalis / Penyiar Utama', weight: 60, reason: 'Melakukan liputan langsung di lapangan dan penulisan naskah berita berkualitas.' },
                      { level: 'Level 3', role: 'Editor Audio Visual / Sosmed Officer', weight: 40, reason: 'Melakukan editing, layout grafis, penyuntingan bahasa, dan penjadwalan publish konten.' }
                    ];
                  } else {
                    cascadingList = [
                      { level: 'Level 3', role: 'Pranata Komputer / Teknis Fungsional', weight: 50, reason: 'Melakukan pemeliharaan sistem harian, penyusunan logbook eviden, dan troubleshooting.' },
                      { level: 'Level 3', role: 'Staf Pelaksana Umum / Pendukung', weight: 50, reason: 'Melakukan pengarsipan dokumen, entry data mentah, dan fasilitasi rapat evaluasi.' }
                    ];
                  }
                }

                // Dynamic periodic breakdown calculation
                let periods: { label: string; code: string; calc: string; value: string }[] = [];
                if (simUnit === '%' || simUnit.toLowerCase() === 'indeks') {
                  const baseNum = simTarget || 90;
                  periods = [
                    { label: 'Bulanan (Jan - Des)', code: 'Bld', calc: 'Flat Target', value: `${baseNum} ${simUnit}` },
                    { label: 'Triwulan I', code: 'TW I', calc: 'Awal Kinerja', value: `${Math.round(baseNum * 0.95)} ${simUnit}` },
                    { label: 'Triwulan II', code: 'TW II', calc: 'Tengah Kinerja', value: `${baseNum} ${simUnit}` },
                    { label: 'Triwulan III', code: 'TW III', calc: 'Akselerasi', value: `${baseNum} ${simUnit}` },
                    { label: 'Triwulan IV', code: 'TW IV', calc: 'Puncak Target', value: `${baseNum} ${simUnit}` },
                    { label: 'Semester I', code: 'SM I', calc: 'Evaluasi Tengah', value: `${baseNum} ${simUnit}` },
                    { label: 'Semester II', code: 'SM II', calc: 'Evaluasi Akhir', value: `${baseNum} ${simUnit}` },
                    { label: 'Tahunan', code: 'THN', calc: 'Target Penuh', value: `${baseNum} ${simUnit}` }
                  ];
                } else {
                  const totalCount = simTarget || 120;
                  const monthlyStep = Math.round(totalCount / 12);
                  periods = [
                    { label: 'Bulanan (Rata-rata)', code: 'Bld', calc: `~${monthlyStep} per Bulan`, value: `+${monthlyStep} ${simUnit} / Bln` },
                    { label: 'Triwulan I (Akumulatif)', code: 'TW I', calc: '25% Akumulasi', value: `${Math.round(totalCount * 0.25)} ${simUnit}` },
                    { label: 'Triwulan II (Akumulatif)', code: 'TW II', calc: '50% Akumulasi', value: `${Math.round(totalCount * 0.50)} ${simUnit}` },
                    { label: 'Triwulan III (Akumulatif)', code: 'TW III', calc: '75% Akumulasi', value: `${Math.round(totalCount * 0.75)} ${simUnit}` },
                    { label: 'Triwulan IV (Akumulatif)', code: 'TW IV', calc: '100% Akumulasi', value: `${totalCount} ${simUnit}` },
                    { label: 'Semester I (Akumulatif)', code: 'SM I', calc: '50% Akumulasi', value: `${Math.round(totalCount * 0.50)} ${simUnit}` },
                    { label: 'Semester II (Akumulatif)', code: 'SM II', calc: '100% Akumulasi', value: `${totalCount} ${simUnit}` },
                    { label: 'Tahunan (Total)', code: 'THN', calc: 'Target Penuh', value: `${totalCount} ${simUnit}` }
                  ];
                }

                // Teks Analisis Generator
                let pendorong = '';
                let penghambat = '';
                let tindakLanjut = '';

                if (score >= 100) {
                  pendorong = simTheme === 'pnbp'
                    ? 'Optimalisasi penetapan tarif sewa lahan menara bersama mitra strategis serta tertib administrasi billing tagihan SIMPONI yang dikawal secara berkala setiap bulan.'
                    : simTheme === 'berita'
                    ? 'Adanya mekanisme penugasan liputan jurnalis berbasis bento-grid yang disiplin, didukung ketersediaan kuota internet pelaporan mobile serta respons cepat tim penyuntingan konten multiplatform.'
                    : simTheme === 'tu'
                    ? 'Tertib administrasi perkantoran digital berbasis srikandi, pengarsipan otomatis tanpa keterlambatan, serta pelatihan penyusunan logbook kerja yang dipandu tim TU.'
                    : 'Tingginya komitmen pimpinan dalam memonitor pendelegasian tugas secara berkala, sinergi yang harmonis antar ketua tim kerja, serta pemanfaatan dashboard digital SAKIP secara real-time.';
                  
                  penghambat = simTheme === 'pnbp'
                    ? 'Fluktuasi kurs mata uang asing yang mempengaruhi beberapa mitra sewa korporasi internasional, namun berhasil diantisipasi dengan penyesuaian skema invoice dinamis.'
                    : simTheme === 'berita'
                    ? 'Tingginya frekuensi agenda dinas mendadak (breaking news) daerah yang membagi fokus tim, namun dapat ditangani melalui sistem piket silang redaksi.'
                    : simTheme === 'tu'
                    ? 'Adanya mutasi personil mendadak di pertengahan bulan namun cepat diantisipasi dengan pemetaan ulang peran staf administrasi fungsional.'
                    : 'Kendala teknis minor pada stabilitas jaringan internet satelit di stasiun transmisi terpencil, yang untungnya cepat ditangani oleh tim darurat pemeliharaan.';
                  
                  tindakLanjut = simTheme === 'pnbp'
                    ? 'Mempertahankan intensitas koordinasi dengan Kemenkeu terkait perizinan tarif PNBP baru serta memperluas segmentasi penawaran pemancar ke operator telekomunikasi lokal.'
                    : simTheme === 'berita'
                    ? 'Meningkatkan standar kualitas jurnalisme melalui pelatihan sertifikasi kompetensi dewan pers dan standarisasi perlengkapan audio-visual mobile jurnalis.'
                    : simTheme === 'tu'
                    ? 'Melakukan standarisasi operasional prosedur pengisian SPJ secara online untuk mempercepat pencairan anggaran sisa kuartal.'
                    : 'Melakukan standarisasi SOP keberhasilan triwulan ini agar menjadi panduan baku kinerja pada periode anggaran berikutnya.';
                } else if (score >= 80) {
                  pendorong = simTheme === 'pnbp'
                    ? 'Realisasi kontrak eksisting berjalan stabil sesuai jadwal pembayaran rutin dari mitra utama. Tim penagihan intens melakukan reminder secara ramah via e-mail.'
                    : simTheme === 'berita'
                    ? 'Tim peliputan berhasil menjaga kuantitas rilis berita radio reguler secara konsisten sesuai target harian yang dibebankan pimpinan redaksi.'
                    : simTheme === 'tu'
                    ? 'Keaktifan absensi pegawai dan kelancaran sirkulasi memo dinas harian mendukung kelancaran administrasi kerja.'
                    : 'Adanya komunikasi taktis mingguan yang berjalan lancar antara penanggung jawab kegiatan dengan atasan langsung untuk memecahkan hambatan administrasi di lapangan.';
                  
                  penghambat = simTheme === 'pnbp'
                    ? 'Terdapat penundaan kelengkapan berkas administrasi kontrak sewa baru dari salah satu mitra, sehingga pembayaran baru tercatat di akhir siklus periode.'
                    : simTheme === 'berita'
                    ? 'Keterbatasan jumlah kamera portabel beresolusi tinggi yang siap pakai, memaksa beberapa reporter mengoptimalkan gawai pribadi masing-masing.'
                    : simTheme === 'tu'
                    ? 'Keterlambatan penyampaian laporan pertanggungjawaban kegiatan teknis luar daerah dari unit fungsional lain kepada seksi tata usaha.'
                    : 'Alokasi anggaran operasional perjalanan dinas peliputan lapangan yang baru cair di pertengahan triwulan, menuntut efisiensi akomodasi rute.';
                  
                  tindakLanjut = simTheme === 'pnbp'
                    ? 'Membuat sistem template pengingat pembayaran otomatis (automated billing alert) untuk meminimalisir keterlambatan administrasi dari pihak mitra.'
                    : simTheme === 'berita'
                    ? 'Mengajukan pengadaan paket upgrade peralatan peliputan taktis ringan (vlog kit) pada usulan revisi anggaran operasional triwulan depan.'
                    : simTheme === 'tu'
                    ? 'Menyelenggarakan klinik e-SPJ singkat setiap akhir bulan guna memangkas durasi verifikasi berkas keuangan pelaksana.'
                    : 'Meningkatkan frekuensi monitoring capaian mingguan untuk mengantisipasi potensi keterlambatan target di triwulan berikutnya.';
                } else {
                  pendorong = simTheme === 'pnbp'
                    ? 'Adanya komitmen pembayaran cicilan tunggakan piutang dari sebagian mitra lama yang kooperatif meskipun bisnis sewa sedang melambat.'
                    : simTheme === 'berita'
                    ? 'Dedikasi tinggi beberapa staf pelaksana jurnalis yang bersedia lembur menyelesaikan penugasan program siaran di tengah keterbatasan fasilitas penunjang.'
                    : simTheme === 'tu'
                    ? 'Masih berjalannya layanan kepegawaian standar seperti pelaporan LHKPN dan rekapitulasi data e-kinerja bulanan.'
                    : 'Masih terjaganya komunikasi administratif dasar dalam unit organisasi untuk mencatat setiap kendala pencapaian kaskade sasaran.';
                  
                  penghambat = simTheme === 'pnbp'
                    ? 'Adanya pemutusan sewa kontrak sepihak dari dua mitra utama karena relokasi bisnis, diperparah belum ditetapkannya regulasi tarif layanan PNBP stasiun yang kompetitif.'
                    : simTheme === 'berita'
                    ? 'Kekurangan tenaga editor tersertifikasi dan rusaknya unit komputer editing utama, menyebabkan terjadinya bottleneck parah pada antrean rilis video konten.'
                    : simTheme === 'tu'
                    ? 'Proses penyusunan anggaran RKAKL stasiun yang membutuhkan banyak revisi manual karena perubahan nomenklatur di kementerian pusat.'
                    : 'Adanya refocusing alokasi anggaran operasional instansi secara masif di awal semester, menyebabkan pembatasan ketat jadwal dinas lapangan tim teknis.';
                  
                  tindakLanjut = simTheme === 'pnbp'
                    ? 'Menyusun ulang strategi pricing sewa aset non-core, melakukan penagihan persuasif langsung ke direksi mitra menunggak, dan berkoordinasi aktif dengan KPKNL.'
                    : simTheme === 'berita'
                    ? 'Mengatur ulang pembagian tugas editor lintas bidang, menjajaki kerjasama magang dengan SMK/Universitas multimedia, serta mengusulkan servis komputer darurat.'
                    : simTheme === 'tu'
                    ? 'Mengoptimalkan pengisian sisa anggaran belanja operasional secara bertahap dan melakukan koordinasi terpusat dengan biro perencanaan.'
                    : 'Mengajukan revisi target kinerja yang lebih rasional sesuai ketersediaan anggaran riil pasca-refocusing kepada pimpinan melalui dewan evaluasi.';
                }

                const combinedDraftText = `== DRAFT ANALISIS SAKIP & MANAJEMEN KINERJA ASN (PERMENPAN RB) ==
Sasaran: ${simCustomName}
Capaian: ${score}% (Predikat SAKIP: ${sakipPred} - ${sakipLabel} | Nilai ASN: ${asnRating})

1. FAKTOR PENDORONG:
${pendorong}

2. FAKTOR PENGHAMBAT:
${penghambat}

3. TINDAK LANJUT REKOMENDASI:
${tindakLanjut}

[Draft disusun otomatis oleh Sistem Pakar SAKIP pada ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}]`;

                const handleCopyText = () => {
                  navigator.clipboard.writeText(combinedDraftText);
                  if (onAddNotification) {
                    onAddNotification({
                      id: `notif-copy-${Date.now()}`,
                      title: 'Salin Berhasil',
                      message: 'Draf analisis SAKIP berhasil disalin ke clipboard!',
                      type: 'info',
                      timestamp: new Date().toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                      isRead: false
                    });
                  }
                };

                const handleSaveAsComment = () => {
                  if (simSelectedIndicatorId === 'custom') {
                    if (onAddNotification) {
                      onAddNotification({
                        id: `notif-warn-${Date.now()}`,
                        title: 'Butuh Rujukan',
                        message: 'Harap pilih salah satu sasaran kinerja rujukan terlebih dahulu untuk menyimpan sebagai catatan resmi.',
                        type: 'warning',
                        timestamp: new Date().toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                        isRead: false
                      });
                    }
                    return;
                  }
                  const found = allIndicatorsList.find(item => item.indicator.id === simSelectedIndicatorId);
                  if (found) {
                    handleAddComment(found.agreement.id, found.indicator.id, combinedDraftText);
                    if (onAddNotification) {
                      onAddNotification({
                        id: `notif-save-${Date.now()}`,
                        title: 'Catatan Diposting',
                        message: `Berhasil memposting draf analisis Sistem Pakar sebagai komentar resmi pada "${found.indicator.indicatorName}"!`,
                        type: 'info',
                        timestamp: new Date().toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                        isRead: false
                      });
                    }
                  }
                };

                return (
                  <div className="space-y-6">
                    
                    {/* Module 3: SAKIP Predicate & ASN Rating */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs space-y-4">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-indigo-600" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Modul 3: Simulasi Capaian &amp; Predikat Akuntabilitas</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Math box */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex flex-col justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Rumus Capaian</span>
                          <div className="my-2">
                            <p className="text-[10px] text-slate-500">Realisasi / Target × 100%</p>
                            <p className="text-xl font-black font-mono text-slate-800 mt-1">
                              {simRealization} / {simTarget}
                            </p>
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono leading-none">Maksimal dihitung 120%</span>
                        </div>

                        {/* SAKIP badge */}
                        <div className={`p-4 rounded-2xl border flex flex-col justify-between ${sakipColor}`}>
                          <span className="text-[9px] font-bold uppercase tracking-wider">Predikat SAKIP Organisasi</span>
                          <div className="my-2">
                            <p className="text-2xl font-black font-mono leading-none">{score}%</p>
                            <p className="text-xs font-black mt-1">Predikat: {sakipPred}</p>
                          </div>
                          <span className="text-[9px] font-mono leading-normal font-bold">({sakipLabel})</span>
                        </div>

                        {/* ASN badge */}
                        <div className={`p-4 rounded-2xl border text-white flex flex-col justify-between ${asnColor}`}>
                          <span className="text-[9px] font-bold text-white/80 uppercase tracking-wider">Rating Kinerja ASN (Permenpan)</span>
                          <div className="my-2">
                            <p className="text-base font-black leading-tight">{asnRating}</p>
                            <p className="text-[8.5px] leading-tight text-white/95 mt-1">{asnDesc.substring(0, 75)}...</p>
                          </div>
                          <span className="text-[9px] text-white/70 font-mono leading-none">Standar Permenpan RB 6/2022</span>
                        </div>
                      </div>
                    </div>

                    {/* Module 1: Cascading & Weight Recommended */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs space-y-4">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Modul 1: Struktur Cascading &amp; Bobot (Rekomendasi Pakar)</span>
                      </div>

                      <div className="space-y-2.5">
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Berdasarkan kaskade vertikal, indikator di tingkat <strong>{simLevel}</strong> direkomendasikan untuk didelegasikan kepada pelaksana subordinat dengan rincian bobot pembagian berikut:
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {cascadingList.map((item, idx) => (
                            <div key={idx} className="p-3 bg-slate-50/50 border border-slate-150 rounded-2xl flex flex-col justify-between gap-2 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-[9px] font-black text-indigo-700 font-mono">{item.level}</span>
                                <span className="font-extrabold text-indigo-600 font-mono text-[11px]">Bobot: {item.weight}%</span>
                              </div>
                              <div>
                                <p className="font-black text-slate-800">{item.role}</p>
                                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{item.reason}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Module 2: Periodic Target Breakdown */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs space-y-4">
                      <div className="flex items-center gap-2">
                        <Table className="w-4 h-4 text-indigo-600" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Modul 2: Breakdown Pembagian Target Berkala (Akumulatif)</span>
                      </div>

                      <div className="overflow-x-auto border border-slate-150 rounded-2xl bg-slate-50/30">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-500 border-b border-slate-150 uppercase tracking-wider">
                              <th className="p-3">Periode Evaluasi</th>
                              <th className="p-3">Kode</th>
                              <th className="p-3">Logika Penghitungan</th>
                              <th className="p-3 text-right">Nilai Target</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 bg-white">
                            {periods.map((p, i) => (
                              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3 font-bold text-slate-700">{p.label}</td>
                                <td className="p-3 font-mono font-extrabold text-indigo-600">{p.code}</td>
                                <td className="p-3 text-slate-400 text-[10px]">{p.calc}</td>
                                <td className="p-3 text-right font-black font-mono text-slate-800">{p.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Module 4: Teks Analisis Generator */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Modul 4: Draft Analisis Evaluasi (LKE &amp; LKjIP)</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleCopyText}
                            className="flex items-center gap-1 px-3 py-1.5 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin Draft</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={handleSaveAsComment}
                            disabled={simSelectedIndicatorId === 'custom'}
                            className={`flex items-center gap-1 px-3.5 py-1.5 text-white text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer ${
                              simSelectedIndicatorId === 'custom'
                                ? 'bg-indigo-300 cursor-not-allowed opacity-60'
                                : 'bg-indigo-600 hover:bg-indigo-500'
                            }`}
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Posting Catatan Resmi</span>
                          </button>
                        </div>
                      </div>

                      {simSelectedIndicatorId === 'custom' && (
                        <p className="text-[10px] text-amber-600 font-extrabold bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                          💡 Catatan: Pilih sasaran rujukan di sidebar untuk mengaktifkan tombol "Posting Catatan Resmi" guna menempelkan hasil analisis ini langsung ke database evaluasi indikator!
                        </p>
                      )}

                      <div className="grid grid-cols-1 gap-4">
                        {/* Pendorong */}
                        <div className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-2xl space-y-1">
                          <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider font-mono">Faktor Pendorong (Sebab Sukses)</span>
                          <p className="text-xs text-slate-700 leading-relaxed font-bold">{pendorong}</p>
                        </div>

                        {/* Penghambat */}
                        <div className="p-4 bg-rose-50/20 border border-rose-100 rounded-2xl space-y-1">
                          <span className="text-[9px] font-black text-rose-700 uppercase tracking-wider font-mono">Faktor Penghambat (Hambatan)</span>
                          <p className="text-xs text-slate-700 leading-relaxed font-bold">{penghambat}</p>
                        </div>

                        {/* Tindak Lanjut */}
                        <div className="p-4 bg-indigo-50/20 border border-indigo-100 rounded-2xl space-y-1">
                          <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider font-mono">Tindak Lanjut &amp; Rekomendasi</span>
                          <p className="text-xs text-slate-700 leading-relaxed font-bold">{tindakLanjut}</p>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })()}

            </div>

          </div>
        </div>
      )}

      {/* Delegation Modal Overlay */}
      {delegatingIndicator && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-100 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GitFork className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Delegasikan Sasaran (Cascading)</h3>
                  <p className="text-[10px] text-slate-400">Turunkan dan kaskadekan indikator kinerja ke level bawahan.</p>
                </div>
              </div>
              <button 
                onClick={() => setDelegatingIndicator(null)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Source target summary card */}
            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-1">
              <span className="text-[8px] font-black text-indigo-500 uppercase tracking-wider block">Indikator Kinerja Sumber (Atasan):</span>
              <p className="text-xs font-bold text-slate-800 leading-normal">{delegatingIndicator.indicator.indicatorName}</p>
              <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                <span>Target Atasan: <span className="font-bold text-slate-700">{delegatingIndicator.indicator.target} {delegatingIndicator.indicator.unit}</span></span>
                <span>•</span>
                <span>Didelegasikan oleh: <span className="font-bold text-slate-700">{delegatingIndicator.sourceAgreement.assignedToName}</span></span>
              </div>
            </div>

            {/* Existing Active Delegations List */}
            {existingDelegationsForCurrent.length > 0 && (
              <div className="space-y-2">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Daftar Pendelegasian Aktif dari Target Ini:</span>
                <div className="max-h-28 overflow-y-auto border border-slate-150 rounded-2xl divide-y divide-slate-100 bg-slate-50/30">
                  {existingDelegationsForCurrent.map(({ indicator, agreement }) => (
                    <div key={indicator.id} className="p-2.5 flex items-center justify-between gap-3 text-xs bg-white">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-700 truncate">{indicator.indicatorName}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>Penerima: <span className="font-extrabold text-indigo-600">{agreement.assignedToName} ({agreement.level})</span></span>
                          <span>•</span>
                          <span>Target: <span className="font-extrabold text-slate-600">{indicator.target} {indicator.unit}</span></span>
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm(`Apakah Anda yakin ingin membatalkan/menghapus pendelegasian target kepada "${agreement.assignedToName}"?`)) {
                            handleDeleteIndicator(agreement.id, indicator.id);
                          }
                        }}
                        className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-lg transition-colors shrink-0"
                        title="Batal / Hapus Delegasi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delegation inputs */}
            <div className="space-y-4">
              
              {/* Select Recipient */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Level selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">Level Jabatan Bawahan</label>
                  {delegatingIndicator.sourceAgreement.level === 'Kepala Stasiun' ? (
                    <select
                      value={delegateLevel}
                      onChange={(e) => {
                        setDelegateLevel(e.target.value);
                        setDelegateEmployeeId('');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-400"
                    >
                      {level2Options.map(o => (
                        <option key={o.value} value={o.value}>{o.value}</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value="Pegawai Staf" 
                      disabled 
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-400"
                    />
                  )}
                </div>

                {/* Specific Employee selection (only active for Pegawai level) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">Pejabat / Staf Pegawai Penerima</label>
                  {delegateLevel === 'Pegawai' || delegatingIndicator.sourceAgreement.level !== 'Kepala Stasiun' ? (
                    <select
                      value={delegateEmployeeId}
                      onChange={(e) => setDelegateEmployeeId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-400"
                    >
                      <option value="">-- Pilih Pegawai --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.nama} ({emp.divisi})</option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      value={resolveLevelName(delegateLevel)}
                      disabled 
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-500"
                    />
                  )}
                </div>

              </div>

              {/* Delegated target name */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">Indikator Hasil Delegasi (Sasaran Kinerja Baru)</label>
                <textarea
                  value={delegatedIndicatorName}
                  onChange={(e) => setDelegatedIndicatorName(e.target.value)}
                  placeholder="Deskripsikan kontribusi spesifik atau sub-target dari bawahan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-bold focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-400 h-16 resize-none"
                />
              </div>

              {/* Delegated target and unit */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">Target Kinerja</label>
                  <input
                    type="text"
                    value={delegatedTarget}
                    onChange={(e) => setDelegatedTarget(e.target.value)}
                    placeholder="Contoh: 90"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-center focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">Satuan Ukur</label>
                  <input
                    type="text"
                    value={delegatedUnit}
                    onChange={(e) => setDelegatedUnit(e.target.value)}
                    placeholder="Contoh: Laporan / %"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-center focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">Bobot (%)</label>
                  <input
                    type="number"
                    value={delegatedWeight}
                    onChange={(e) => setDelegatedWeight(parseInt(e.target.value) || 25)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-center focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
              </div>

            </div>

            {/* Modal actions */}
            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setDelegatingIndicator(null)}
                className="px-4 py-2 hover:bg-slate-50 text-slate-500 font-bold text-xs rounded-xl transition-colors"
              >
                Batal
              </button>
              
              <button
                onClick={submitDelegation}
                disabled={!delegatedIndicatorName || !delegatedTarget || (delegateLevel === 'Pegawai' && !delegateEmployeeId)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs"
              >
                <Send className="w-3.5 h-3.5" /> Kirim Delegasi
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add/Edit Indicator Modal */}
      {editingAgreementId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-100 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Tambah Sasaran Kinerja Baru</h3>
                  <p className="text-[10px] text-slate-400">Tambahkan Indikator Kinerja Utama (IKU) baru pada dokumen perjanjian kinerja.</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingAgreementId(null)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">Nama Indikator Kinerja Utama (IKU)</label>
                <textarea
                  value={newIndicatorName}
                  onChange={(e) => setNewIndicatorName(e.target.value)}
                  placeholder="Contoh: Persentase efektivitas penyebaran informasi publik"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 font-bold focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-400 h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">Target Kinerja</label>
                  <input
                    type="text"
                    value={newIndicatorTarget}
                    onChange={(e) => setNewIndicatorTarget(e.target.value)}
                    placeholder="Contoh: 100"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-center focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">Satuan Ukur</label>
                  <input
                    type="text"
                    value={newIndicatorUnit}
                    onChange={(e) => setNewIndicatorUnit(e.target.value)}
                    placeholder="Contoh: % atau Laporan"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-center focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">Bobot (%)</label>
                  <input
                    type="number"
                    value={newIndicatorWeight}
                    onChange={(e) => setNewIndicatorWeight(parseInt(e.target.value) || 25)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-center focus:outline-hidden focus:bg-white focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingAgreementId(null)}
                className="px-4 py-2 hover:bg-slate-50 text-slate-500 font-bold text-xs rounded-xl transition-colors"
              >
                Batal
              </button>
              
              <button
                onClick={() => handleAddIndicator(editingAgreementId)}
                disabled={!newIndicatorName || !newIndicatorTarget}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Sasaran
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SAKIP & ASN Performance Expert Assistant Modal Removed */}
      {false && sakipExpertData && (() => {
        const ind = sakipExpertData.indicator;
        const targetVal = parseFloat(ind.target) || 100;
        const realVal = ind.achievement || 0;
        const score = targetVal > 0 ? Math.min(120, Math.round((realVal / targetVal) * 100)) : 0;
        const unit = ind.unit || '%';
        const indName = ind.indicatorName;

        // Calculate SAKIP Predicate
        let sakipPred = 'B';
        let sakipLabel = 'Baik';
        let sakipColor = 'text-indigo-600 bg-indigo-50 border-indigo-200';
        if (score >= 90) {
          sakipPred = 'AA';
          sakipLabel = 'Sangat Memuaskan';
          sakipColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
        } else if (score >= 80) {
          sakipPred = 'A';
          sakipLabel = 'Memuaskan';
          sakipColor = 'text-teal-700 bg-teal-50 border-teal-200';
        } else if (score >= 70) {
          sakipPred = 'BB';
          sakipLabel = 'Sangat Baik';
          sakipColor = 'text-blue-700 bg-blue-50 border-blue-200';
        } else if (score >= 60) {
          sakipPred = 'B';
          sakipLabel = 'Baik';
          sakipColor = 'text-indigo-700 bg-indigo-50 border-indigo-200';
        } else if (score >= 50) {
          sakipPred = 'CC';
          sakipLabel = 'Cukup';
          sakipColor = 'text-amber-700 bg-amber-50 border-amber-200';
        } else if (score >= 30) {
          sakipPred = 'C';
          sakipLabel = 'Kurang';
          sakipColor = 'text-orange-700 bg-orange-50 border-orange-200';
        } else {
          sakipPred = 'D';
          sakipLabel = 'Sangat Kurang';
          sakipColor = 'text-rose-700 bg-rose-50 border-rose-200';
        }

        // Calculate ASN Predicate (Permenpan RB 6/2022)
        let asnRating = 'BAIK';
        let asnColor = 'bg-emerald-500 text-white';
        let asnDesc = 'Hasil kerja sesuai dengan ekspektasi pimpinan dan kontribusi organisasi tercapai secara optimal.';
        if (score >= 100) {
          asnRating = 'SANGAT BAIK';
          asnColor = 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white';
          asnDesc = 'Hasil kerja secara konsisten melampaui ekspektasi pimpinan serta menginspirasi rekan kerja lainnya.';
        } else if (score >= 80) {
          asnRating = 'BAIK';
          asnColor = 'bg-emerald-500 text-white';
          asnDesc = 'Hasil kerja sesuai ekspektasi dan memberikan dampak positif langsung pada pencapaian target unit kerja.';
        } else if (score >= 70) {
          asnRating = 'BUTUH PERBAIKAN';
          asnColor = 'bg-amber-500 text-white';
          asnDesc = 'Sebagian hasil kerja belum sepenuhnya memenuhi ekspektasi pimpinan, diperlukan penyesuaian strategi.';
        } else if (score >= 50) {
          asnRating = 'KURANG';
          asnColor = 'bg-orange-500 text-white';
          asnDesc = 'Hasil kerja berada di bawah standar minimal ekspektasi pimpinan dan memerlukan pembinaan intensif.';
        } else {
          asnRating = 'SANGAT KURANG';
          asnColor = 'bg-rose-600 text-white';
          asnDesc = 'Hasil kerja jauh di bawah ekspektasi pimpinan dan merugikan capaian akuntabilitas unit organisasi.';
        }

        // Custom domain context matching
        const isPnbp = indName.toLowerCase().includes('pnbp') || indName.toLowerCase().includes('pendapatan') || indName.toLowerCase().includes('usaha');
        const isBerita = indName.toLowerCase().includes('berita') || indName.toLowerCase().includes('pemberitaan') || indName.toLowerCase().includes('konten') || indName.toLowerCase().includes('siaran');

        // Dynamic Cascading division and weights
        let cascadingList: { level: string; role: string; weight: number; reason: string }[] = [];
        if (sakipExpertData.level === 'Kepala Stasiun') {
          if (isPnbp) {
            cascadingList = [
              { level: 'Level 2', role: 'Ketua Tim Layanan Pengembangan Usaha', weight: 60, reason: 'Penanggung jawab utama pencarian mitra kerjasama dan penagihan piutang PNBP.' },
              { level: 'Level 2', role: 'Ketua Tim Siaran', weight: 40, reason: 'Pemberi slot penyiaran / iklan layanan sebagai komoditas utama kerjasama.' }
            ];
          } else if (isBerita) {
            cascadingList = [
              { level: 'Level 2', role: 'Ketua Tim Pemberitaan', weight: 50, reason: 'Bertanggung jawab atas produksi berita radio harian dan akurasi informasi redaksi.' },
              { level: 'Level 2', role: 'Ketua Tim Konten Media Baru', weight: 30, reason: 'Bertanggung jawab atas diseminasi berita ke portal online dan infografis media sosial.' },
              { level: 'Level 2', role: 'Ketua Tim Teknologi dan Media Baru', weight: 20, reason: 'Menyediakan infrastruktur streaming dan pemeliharaan server portal berita.' }
            ];
          } else {
            cascadingList = [
              { level: 'Level 2', role: 'Kepala Bagian Tata Usaha (Kabid)', weight: 40, reason: 'Mendukung fasilitasi anggaran operasional dan administrasi seluruh program kerja.' },
              { level: 'Level 2', role: 'Seluruh Ketua Tim Kerja', weight: 60, reason: 'Pelaksana taktis sasaran strategis sesuai pembagian divisi fungsional.' }
            ];
          }
        } else {
          // Cascading to Level 3 (Pegawai)
          if (isPnbp) {
            cascadingList = [
              { level: 'Level 3', role: 'Staf Administrasi Kerjasama (PUPN)', weight: 50, reason: 'Melakukan penatausahaan kontrak mitra, rekonsiliasi billing, dan verifikasi setor kas negara.' },
              { level: 'Level 3', role: 'Account Executive / Sales Staf', weight: 50, reason: 'Melakukan canvassing calon mitra, penyusunan proposal sewa aset, dan negosiasi tarif.' }
            ];
          } else if (isBerita) {
            cascadingList = [
              { level: 'Level 3', role: 'Reporter Jurnalis / Penyiar Utama', weight: 60, reason: 'Melakukan liputan langsung di lapangan dan penulisan naskah berita berkualitas.' },
              { level: 'Level 3', role: 'Editor Audio Visual / Sosmed Officer', weight: 40, reason: 'Melakukan editing, layout grafis, penyuntingan bahasa, dan penjadwalan publish konten.' }
            ];
          } else {
            cascadingList = [
              { level: 'Level 3', role: 'Pranata Komputer / Teknis Fungsional', weight: 50, reason: 'Melakukan pemeliharaan sistem harian, penyusunan logbook eviden, dan troubleshooting.' },
              { level: 'Level 3', role: 'Staf Pelaksana Umum / Pendukung', weight: 50, reason: 'Melakukan pengarsipan dokumen, entry data mentah, dan fasilitasi rapat evaluasi.' }
            ];
          }
        }

        // Dynamic periodic breakdown calculation
        let periods: { label: string; code: string; calc: string; value: string }[] = [];
        if (unit === '%' || unit.toLowerCase() === 'indeks') {
          const baseNum = parseFloat(ind.target) || 90;
          periods = [
            { label: 'Bulanan (Jan - Des)', code: 'Bld', calc: 'Flat Target', value: `${baseNum} ${unit}` },
            { label: 'Triwulan I', code: 'TW I', calc: 'Awal Kinerja', value: `${Math.round(baseNum * 0.95)} ${unit}` },
            { label: 'Triwulan II', code: 'TW II', calc: 'Tengah Kinerja', value: `${baseNum} ${unit}` },
            { label: 'Triwulan III', code: 'TW III', calc: 'Akselerasi', value: `${baseNum} ${unit}` },
            { label: 'Triwulan IV', code: 'TW IV', calc: 'Puncak Target', value: `${baseNum} ${unit}` },
            { label: 'Semester I', code: 'SM I', calc: 'Evaluasi Tengah', value: `${baseNum} ${unit}` },
            { label: 'Semester II', code: 'SM II', calc: 'Evaluasi Akhir', value: `${baseNum} ${unit}` },
            { label: 'Tahunan', code: 'THN', calc: 'Target Penuh', value: `${baseNum} ${unit}` }
          ];
        } else {
          const totalCount = parseFloat(ind.target) || 120;
          const monthlyStep = Math.round(totalCount / 12);
          periods = [
            { label: 'Bulanan (Rata-rata)', code: 'Bld', calc: `~${monthlyStep} per Bulan`, value: `+${monthlyStep} ${unit} / Bln` },
            { label: 'Triwulan I (Akumulatif)', code: 'TW I', calc: '25% Akumulasi', value: `${Math.round(totalCount * 0.25)} ${unit}` },
            { label: 'Triwulan II (Akumulatif)', code: 'TW II', calc: '50% Akumulasi', value: `${Math.round(totalCount * 0.50)} ${unit}` },
            { label: 'Triwulan III (Akumulatif)', code: 'TW III', calc: '75% Akumulasi', value: `${Math.round(totalCount * 0.75)} ${unit}` },
            { label: 'Triwulan IV (Akumulatif)', code: 'TW IV', calc: '100% Akumulasi', value: `${totalCount} ${unit}` },
            { label: 'Semester I (Akumulatif)', code: 'SM I', calc: '50% Akumulasi', value: `${Math.round(totalCount * 0.50)} ${unit}` },
            { label: 'Semester II (Akumulatif)', code: 'SM II', calc: '100% Akumulasi', value: `${totalCount} ${unit}` },
            { label: 'Tahunan (Total)', code: 'THN', calc: 'Target Penuh', value: `${totalCount} ${unit}` }
          ];
        }

        // Teks Analisis Generator
        let pendorong = '';
        let penghambat = '';
        let tindakLanjut = '';

        if (score >= 100) {
          pendorong = isPnbp
            ? 'Optimalisasi penetapan tarif sewa lahan menara bersama mitra strategis serta tertib administrasi billing tagihan SIMPONI yang dikawal secara berkala setiap bulan.'
            : isBerita
            ? 'Adanya mekanisme penugasan liputan jurnalis berbasis bento-grid yang disiplin, didukung ketersediaan kuota internet pelaporan mobile serta respons cepat tim penyuntingan konten multiplatform.'
            : 'Tingginya komitmen pimpinan dalam memonitor pendelegasian tugas secara berkala, sinergi yang harmonis antar ketua tim kerja, serta pemanfaatan dashboard digital SAKIP secara real-time.';
          
          penghambat = isPnbp
            ? 'Fluktuasi kurs mata uang asing yang mempengaruhi beberapa mitra sewa korporasi internasional, namun berhasil diantisipasi dengan penyesuaian skema invoice dinamis.'
            : isBerita
            ? 'Tingginya frekuensi agenda dinas mendadak (breaking news) daerah yang membagi fokus tim, namun dapat ditangani melalui sistem piket silang redaksi.'
            : 'Kendala teknis minor pada stabilitas jaringan internet satelit di stasiun transmisi terpencil, yang untungnya cepat ditangani oleh tim darurat pemeliharaan.';
          
          tindakLanjut = isPnbp
            ? 'Mempertahankan intensitas koordinasi dengan Kemenkeu terkait perizinan tarif PNBP baru serta memperluas segmentasi penawaran pemancar ke operator telekomunikasi lokal.'
            : isBerita
            ? 'Meningkatkan standar kualitas jurnalisme melalui pelatihan sertifikasi kompetensi dewan pers dan standarisasi perlengkapan audio-visual mobile jurnalis.'
            : 'Melakukan standarisasi SOP keberhasilan triwulan ini agar menjadi panduan baku kinerja pada periode anggaran berikutnya.';
        } else if (score >= 80) {
          pendorong = isPnbp
            ? 'Realisasi kontrak eksisting berjalan stabil sesuai jadwal pembayaran rutin dari mitra utama. Tim penagihan intens melakukan reminder secara ramah via e-mail.'
            : isBerita
            ? 'Tim peliputan berhasil menjaga kuantitas rilis berita radio reguler secara konsisten sesuai target harian yang dibebankan pimpinan redaksi.'
            : 'Adanya komunikasi taktis mingguan yang berjalan lancar antara penanggung jawab kegiatan dengan atasan langsung untuk memecahkan hambatan administrasi di lapangan.';
          
          penghambat = isPnbp
            ? 'Terdapat penundaan kelengkapan berkas administrasi kontrak sewa baru dari salah satu mitra, sehingga pembayaran baru tercatat di akhir siklus periode.'
            : isBerita
            ? 'Keterbatasan jumlah kamera portabel beresolusi tinggi yang siap pakai, memaksa beberapa reporter mengoptimalkan gawai pribadi masing-masing.'
            : 'Alokasi anggaran operasional perjalanan dinas peliputan lapangan yang baru cair di pertengahan triwulan, menuntut efisiensi akomodasi rute.';
          
          tindakLanjut = isPnbp
            ? 'Membuat sistem template pengingat pembayaran otomatis (automated billing alert) untuk meminimalisir keterlambatan administrasi dari pihak mitra.'
            : isBerita
            ? 'Mengajukan pengadaan paket upgrade peralatan peliputan taktis ringan (vlog kit) pada usulan revisi anggaran operasional triwulan depan.'
            : 'Meningkatkan frekuensi monitoring capaian mingguan untuk mengantisipasi potensi keterlambatan target di triwulan berikutnya.';
        } else {
          pendorong = isPnbp
            ? 'Adanya komitmen pembayaran cicilan tunggakan piutang dari sebagian mitra lama yang kooperatif meskipun bisnis sewa sedang melambat.'
            : isBerita
            ? 'Dedikasi tinggi beberapa staf pelaksana jurnalis yang bersedia lembur menyelesaikan penugasan program siaran di tengah keterbatasan fasilitas penunjang.'
            : 'Masih terjaganya komunikasi administratif dasar dalam unit organisasi untuk mencatat setiap kendala pencapaian kaskade sasaran.';
          
          penghambat = isPnbp
            ? 'Adanya pemutusan sewa kontrak sepihak dari dua mitra utama karena relokasi bisnis, diperparah belum ditetapkannya regulasi tarif layanan PNBP stasiun yang kompetitif.'
            : isBerita
            ? 'Kekurangan tenaga editor tersertifikasi dan rusaknya unit komputer editing utama, menyebabkan terjadinya bottleneck parah pada antrean rilis video konten.'
            : 'Adanya refocusing alokasi anggaran operasional instansi secara masif di awal semester, menyebabkan pembatasan ketat jadwal dinas lapangan tim teknis.';
          
          tindakLanjut = isPnbp
            ? 'Menyusun ulang strategi pricing sewa aset non-core, melakukan penagihan persuasif langsung ke direksi mitra menunggak, dan berkoordinasi aktif dengan KPKNL.'
            : isBerita
            ? 'Mengatur ulang pembagian tugas editor lintas bidang, menjajaki kerjasama magang dengan SMK/Universitas multimedia, serta mengusulkan servis komputer darurat.'
            : 'Mengajukan revisi target kinerja yang lebih rasional sesuai ketersediaan anggaran riil pasca-refocusing kepada pimpinan melalui dewan evaluasi.';
        }

        // Combined drafted comment for posting
        const combinedDraftText = `== DRAFT ANALISIS SAKIP & MANAJEMEN KINERJA ASN (PERMENPAN RB) ==
Sasaran: ${indName}
Capaian: ${score}% (Predikat SAKIP: ${sakipPred} - ${sakipLabel} | Nilai ASN: ${asnRating})

1. FAKTOR PENDORONG:
${pendorong}

2. FAKTOR PENGHAMBAT:
${penghambat}

3. TINDAK LANJUT REKOMENDASI:
${tindakLanjut}

[Draft disusun otomatis oleh Sistem Pakar SAKIP pada ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}]`;

        const handleApplyDraftToComments = () => {
          handleAddComment(sakipExpertData.agreementId, ind.id, combinedDraftText);
          alert("Sukses! Draft analisis SAKIP telah berhasil diposting sebagai Catatan Evaluasi & Feedback resmi untuk sasaran ini.");
          setSakipExpertData(null);
        };

        const handleCopyText = () => {
          navigator.clipboard.writeText(combinedDraftText);
          alert("Draft analisis berhasil disalin ke clipboard!");
        };

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-6 border border-slate-150 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 duration-150 text-slate-700 flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                      Sistem Pakar SAKIP & ASN (Permenpan RB)
                      <span className="px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200 font-mono tracking-wider">
                        EXPERT SYSTEM
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400">Pemeriksaan akuntabilitas kinerja instansi pemerintah dan pendampingan manajemen kerja ASN fungsional.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSakipExpertData(null)}
                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-5 text-xs">
                
                {/* Active Indicator Summary Card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-mono">Indikator Kinerja yang Diperiksa:</span>
                  <p className="text-xs font-extrabold text-slate-800 leading-normal">{indName}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-150/60 text-[10px]">
                    <div>
                      <p className="text-slate-400 font-bold">Pegawai Bertanggung Jawab</p>
                      <p className="font-extrabold text-slate-700 mt-0.5">{sakipExpertData.assignedToName}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold">Level Jabatan SAKIP</p>
                      <p className="font-extrabold text-indigo-600 mt-0.5">{sakipExpertData.level}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold">Nilai Target</p>
                      <p className="font-extrabold text-slate-700 mt-0.5">{ind.target} {unit}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold">Realisasi Riil</p>
                      <p className="font-extrabold text-indigo-600 mt-0.5">{realVal} {unit}</p>
                    </div>
                  </div>
                </div>

                {/* Grid for Cascading and Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  
                  {/* Module 1: Struktur Cascading (Logical Alignment) */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <GitFork className="w-4 h-4 text-indigo-500 shrink-0" />
                        1. Struktur Cascading & Bobot (Permenpan)
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-normal mt-1 mb-3">
                        Rekomendasi penyelarasan target dari level <strong>{sakipExpertData.level}</strong> ke posisi subordinat di bawahnya berdasarkan prinsip cascading vertikal akuntabilitas.
                      </p>
                      
                      <div className="space-y-3">
                        {cascadingList.map((item, i) => (
                          <div key={i} className="p-3 bg-indigo-50/20 border border-indigo-100/50 rounded-xl space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-black bg-indigo-100 text-indigo-800 uppercase tracking-wide">
                                {item.level}
                              </span>
                              <span className="font-mono font-black text-indigo-600 bg-white border border-indigo-150 rounded px-1.5 text-[10px]">
                                Bobot: {item.weight}%
                              </span>
                            </div>
                            <p className="font-extrabold text-slate-700 text-[11px]">{item.role}</p>
                            <p className="text-[10px] text-slate-400 leading-normal">{item.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-3 bg-slate-50 p-2.5 rounded-xl text-[9px] text-slate-400 border border-dashed border-slate-200 leading-normal">
                      <span className="font-bold text-slate-500 uppercase block">Prinsip Cascading:</span>
                      Sesuai Permenpan RB No. 6/2022, pembobotan didasarkan pada tingkat korelasi langsung keberhasilan sasaran subordinat terhadap pencapaian sasaran unit kerja pimpinan.
                    </div>
                  </div>

                  {/* Module 2: Breakdown Target Berkala (Cumulative Target) */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
                      2. Breakdown Target Berkala (Akumulatif)
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-normal mt-1 mb-3">
                      Pembagian nilai target secara taktis berkelanjutan demi memastikan kelancaran evaluasi triwulanan dan semesteran instansi pemerintah.
                    </p>

                    <div className="border border-slate-150 rounded-2xl overflow-hidden bg-slate-50/30">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-150">
                            <th className="p-2.5">Periode Evaluasi</th>
                            <th className="p-2.5 text-center">Metode Hitung</th>
                            <th className="p-2.5 text-right font-mono">Nilai Target</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {periods.map((p, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 bg-white transition-colors">
                              <td className="p-2.5 font-extrabold text-slate-700 flex items-center gap-1.5">
                                <span className="inline-flex items-center justify-center bg-slate-100 text-slate-600 text-[8px] font-black w-10 h-4.5 rounded font-mono uppercase shrink-0">
                                  {p.code}
                                </span>
                                <span>{p.label}</span>
                              </td>
                              <td className="p-2.5 text-center text-[10px] text-slate-400">{p.calc}</td>
                              <td className="p-2.5 text-right font-mono font-extrabold text-indigo-600">{p.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* Module 3: Simulasi Penghitungan Capaian & Predikat */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Target className="w-4 h-4 text-indigo-500 shrink-0" />
                    3. Simulasi & Predikat Kinerja ASN (Permenpan RB 6/2022)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* Formula box */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex flex-col justify-center text-center space-y-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono">RUMUS CAPAIAN SAKIP</p>
                      <div className="p-2 bg-white rounded-lg border border-slate-200 inline-block mx-auto font-mono text-xs font-bold text-slate-700 shadow-2xs">
                        {"("} Realisasi / Target {")"} x 100
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-1 leading-normal">
                        {"("} {realVal} / {targetVal} {")"} x 100 = <span className="font-black text-indigo-600 text-xs">{score}%</span>
                      </p>
                    </div>

                    {/* SAKIP Predicate */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono">PREDIKAT AKUNTABILITAS SAKIP</p>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-lg font-black font-mono border ${sakipColor}`}>
                          {sakipPred}
                        </span>
                        <div>
                          <p className="font-extrabold text-slate-800 text-[11px] leading-none">{sakipLabel}</p>
                          <p className="text-[9px] text-slate-400 mt-1">Nilai standard instansi pemerintah</p>
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-normal">Predikat {sakipPred} menunjukkan efektivitas pemanfaatan anggaran yang {score >= 80 ? "sangat efisien dan berdampak luas" : "belum sepenuhnya optimal pada unit kerja ini"}.</p>
                    </div>

                    {/* ASN Performance Rating */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono">RATING HASIL KERJA ASN</p>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase shrink-0 font-mono ${asnColor}`}>
                          {asnRating}
                        </span>
                        <div>
                          <p className="text-[9px] text-slate-400">Permenpan RB 6/2022</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-sans">{asnDesc}</p>
                    </div>

                  </div>
                </div>

                {/* Module 4: Generator Teks Analisis (LKE / LKjIP) */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2 flex-wrap gap-2">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
                      4. Generator Teks Analisis Realisasi Kinerja (LKE / LKjIP)
                    </h4>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyText}
                        className="flex items-center gap-1 px-2.5 py-1 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                        title="Salin Draft Analisis"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Teks</span>
                      </button>
                      <button
                        onClick={handleApplyDraftToComments}
                        className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg transition-colors shadow-2xs cursor-pointer"
                        title="Posting ke Catatan Evaluasi & Feedback"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Terapkan Sebagai Catatan</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal mt-1 mb-3">
                    Draft kalimat analisis otomatis yang siap digunakan untuk mengisi formulir Lembar Kerja Evaluasi (LKE) dan Laporan Kinerja Instansi Pemerintah (LKjIP).
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    <div className="p-3.5 bg-emerald-50/25 border border-emerald-100 rounded-xl space-y-1.5">
                      <span className="text-[8px] font-black text-emerald-700 uppercase tracking-wider block font-mono">Faktor Pendorong (Sebab Sukses):</span>
                      <p className="text-[10px] text-slate-600 leading-normal font-sans text-justify italic">{pendorong}</p>
                    </div>

                    <div className="p-3.5 bg-rose-50/25 border border-rose-100 rounded-xl space-y-1.5">
                      <span className="text-[8px] font-black text-rose-700 uppercase tracking-wider block font-mono">Faktor Penghambat (Hambatan):</span>
                      <p className="text-[10px] text-slate-600 leading-normal font-sans text-justify italic">{penghambat}</p>
                    </div>

                    <div className="p-3.5 bg-indigo-50/25 border border-indigo-100 rounded-xl space-y-1.5">
                      <span className="text-[8px] font-black text-indigo-700 uppercase tracking-wider block font-mono">Tindak Lanjut & Rekomendasi:</span>
                      <p className="text-[10px] text-slate-600 leading-normal font-sans text-justify italic">{tindakLanjut}</p>
                    </div>

                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 shrink-0">
                <button
                  onClick={() => setSakipExpertData(null)}
                  className="px-4 py-2 hover:bg-slate-50 text-slate-500 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={handleApplyDraftToComments}
                  className="flex items-center gap-1.5 px-4.5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> Posting Draft Analisis Kinerja
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
