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
  Printer
} from 'lucide-react';
import { Employee, InstitutionalIdentity, PerformanceAgreement, PerformanceIndicator, AppSettings, CriticalNotification, NewsReport, CooperationContract, ReporterTarget, IndicatorComment } from '../types';
import SignaturePad from './SignaturePad';
import IndicatorCommentsSection from './IndicatorCommentsSection';

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
  const [activeTab, setActiveTab] = useState<'pohon' | 'dokumen' | 'evaluasi'>('pohon');

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
  
  // For Document Tab selection
  const [selectedDocLevel, setSelectedDocLevel] = useState<string>('Kepala Stasiun');
  const [selectedDocEmployeeId, setSelectedDocEmployeeId] = useState<string>('');

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

  const toggleExpandIndicator = (id: string) => {
    setExpandedIndicators(prev => ({ ...prev, [id]: !prev[id] }));
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

  // Helper to resolve level supervisor (pemberi delegasi)
  const getSupervisorLevel = (level: string) => {
    if (level === 'Kepala Stasiun') return 'Atasan Pusat';
    if (level === 'Pegawai') return 'Ketua Tim / Kabid';
    return 'Kepala Stasiun';
  };

  const getSupervisorName = (level: string, assignedToEmployeeId?: string) => {
    if (level === 'Kepala Stasiun') return 'Direktur Utama / Dewan Pengawas';
    if (level === 'Pegawai' && assignedToEmployeeId) {
      const emp = employees.find(e => e.id === assignedToEmployeeId);
      if (!emp) return 'Ketua Tim';
      // Find suitable team head based on division
      if (emp.divisi === 'Tata Usaha / Umum') return identity.kepalaBidangNama || 'Kepala Bagian Tata Usaha';
      if (emp.divisi === 'Pemberitaan') return identity.ketuaTimPemberitaanNama || 'Ketua Tim Pemberitaan';
      if (emp.divisi === 'Siaran') return identity.ketuaTimSiaranNama || 'Ketua Tim Siaran';
      if (emp.divisi === 'Teknologi dan Media Baru') return identity.ketuaTimTeknikNama || 'Ketua Tim Teknologi & MB';
      if (emp.divisi === 'Konten Media Baru') return identity.ketuaTimKontenNama || 'Ketua Tim Konten MB';
      if (emp.divisi === 'Layanan Pengembangan Usaha') return identity.ketuaTimLayananNama || 'Ketua Tim Layanan PU';
    }
    return identity.kepalaStasiunNama || 'Kepala Stasiun';
  };

  // Active agreement on Document Tab
  const activeDocumentAgreement = useMemo(() => {
    const existing = agreements.find(a => a.year === selectedYear && a.level === selectedDocLevel && (selectedDocLevel !== 'Pegawai' || a.assignedToEmployeeId === selectedDocEmployeeId));
    if (existing) return existing;

    // Return a temporary draft so we can display it cleanly without rendering errors
    const tempAg: PerformanceAgreement = {
      id: `pk-temp-${selectedDocLevel}-${selectedDocEmployeeId || 'none'}`,
      year: selectedYear,
      level: selectedDocLevel as any,
      assignedToEmployeeId: selectedDocLevel === 'Pegawai' ? selectedDocEmployeeId : undefined,
      assignedToName: resolveLevelName(selectedDocLevel, selectedDocEmployeeId),
      objectives: [],
      status: 'Draft',
      createdAt: new Date().toISOString()
    };
    return tempAg;
  }, [selectedDocLevel, selectedDocEmployeeId, agreements, selectedYear]);

  const [evalPeriod, setEvalPeriod] = useState<'q1' | 'q2' | 'q3' | 'q4' | 's1' | 's2' | 'tahunan'>('tahunan');
  const [scaleTargets, setScaleTargets] = useState<boolean>(false);

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

    // Calculate direct Level 3 (Pegawai) achievements
    let tempAgs = yearAgs.map(ag => {
      const objectives = ag.objectives.map(obj => {
        let achievement = obj.achievement;
        let targetVal = parseFloat(obj.target) || 100;

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

        // Apply target scaling if checked
        let targetString = obj.target;
        if (scaleTargets) {
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
        }

        return { ...obj, _scaledTargetVal: targetVal, _scaledTargetString: targetString, achievement };
      });
      return { ...ag, objectives };
    });

    // Roll up Level 3 to Level 2 (Ketua Tim / Kabid)
    tempAgs = tempAgs.map(ag => {
      if (ag.level !== 'Kepala Stasiun' && ag.level !== 'Pegawai') {
        const objectives = ag.objectives.map(l2Obj => {
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
              return { ...l2Obj, achievement: sumAchievement };
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

    agreements.filter(a => a.year === selectedYear).forEach(a => {
      if (a.objectives.length > 0) {
        if (a.status === 'Aktif') activePks++;
        a.objectives.forEach(obj => {
          totalIndicators++;
          // Calculate achievement percentage (realisasi / target * 100, capped at 120%)
          const targetVal = parseFloat(obj.target) || 100;
          const real = obj.achievement || 0;
          const score = Math.min(120, Math.round((real / targetVal) * 100));
          sumAchievement += score;
        });
      }
    });

    const avgAchievement = totalIndicators > 0 ? Math.round(sumAchievement / totalIndicators) : 0;

    return {
      totalIndicators,
      avgAchievement,
      activePks,
      totalPks: agreements.filter(a => a.year === selectedYear && a.objectives.length > 0).length
    };
  }, [agreements, selectedYear]);

  // Cascading tree indexing
  const treeData = useMemo(() => {
    const yearAgs = agreements.filter(a => a.year === selectedYear);
    const kepalaStasiunAg = yearAgs.find(a => a.level === 'Kepala Stasiun');
    
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

      yearAgs.forEach(ag => {
        if (ag.level !== 'Kepala Stasiun' && ag.level !== 'Pegawai') {
          ag.objectives.forEach(obj => {
            if (obj.parentIndicatorId === rootObj.id) {
              // Find level 3 indicators linked to this level 2 indicator
              const children: Array<{
                indicator: PerformanceIndicator;
                agreement: PerformanceAgreement;
              }> = [];

              yearAgs.forEach(pPeg => {
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
  }, [agreements, selectedYear]);

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

    const isTemp = agreementId.startsWith('pk-temp-');
    const isNewKepala = agreementId.startsWith('pk-kepala-');
    let updated: PerformanceAgreement[];

    if (isTemp) {
      const targetLevel = selectedDocLevel;
      const targetEmpId = selectedDocLevel === 'Pegawai' ? selectedDocEmployeeId : undefined;
      
      const newAg: PerformanceAgreement = {
        id: `pk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        year: selectedYear,
        level: targetLevel as any,
        assignedToEmployeeId: targetEmpId,
        assignedToName: resolveLevelName(targetLevel, targetEmpId),
        objectives: [newObj],
        status: 'Draft',
        createdAt: new Date().toISOString()
      };
      updated = [...agreements, newAg];
    } else if (isNewKepala) {
      const newAg: PerformanceAgreement = {
        id: agreementId,
        year: selectedYear,
        level: 'Kepala Stasiun',
        assignedToName: resolveLevelName('Kepala Stasiun'),
        objectives: [newObj],
        status: 'Draft',
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
        status: 'Draft',
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

  // Sign document
  const handleSignDocument = (agreementId: string, role: 'pembuat' | 'penerima', dataUrl: string) => {
    const isTemp = agreementId.startsWith('pk-temp-');
    let updated: PerformanceAgreement[];

    if (isTemp) {
      const signField = role === 'pembuat' ? 'signaturePembuat' : 'signaturePenerima';
      const newAg: PerformanceAgreement = {
        id: `pk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        year: selectedYear,
        level: selectedDocLevel as any,
        assignedToEmployeeId: selectedDocLevel === 'Pegawai' ? selectedDocEmployeeId : undefined,
        assignedToName: resolveLevelName(selectedDocLevel, selectedDocLevel === 'Pegawai' ? selectedDocEmployeeId : undefined),
        objectives: [],
        status: 'Draft',
        createdAt: new Date().toISOString(),
        [signField]: dataUrl
      };
      updated = [...agreements, newAg];
    } else {
      updated = agreements.map(ag => {
        if (ag.id === agreementId) {
          const signField = role === 'pembuat' ? 'signaturePembuat' : 'signaturePenerima';
          const isSignedBoth = (role === 'pembuat' && ag.signaturePenerima) || (role === 'penerima' && ag.signaturePembuat);
          
          return {
            ...ag,
            [signField]: dataUrl,
            status: isSignedBoth ? 'Aktif' : ag.status
          };
        }
        return ag;
      });
    }
    onUpdateAgreements(updated);
  };

  // Quick Action to activate/approve
  const handleApproveDocument = (agreementId: string) => {
    const isTemp = agreementId.startsWith('pk-temp-');
    let updated: PerformanceAgreement[];

    if (isTemp) {
      const newAg: PerformanceAgreement = {
        id: `pk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        year: selectedYear,
        level: selectedDocLevel as any,
        assignedToEmployeeId: selectedDocLevel === 'Pegawai' ? selectedDocEmployeeId : undefined,
        assignedToName: resolveLevelName(selectedDocLevel, selectedDocLevel === 'Pegawai' ? selectedDocEmployeeId : undefined),
        objectives: [],
        status: 'Aktif',
        createdAt: new Date().toISOString()
      };
      updated = [...agreements, newAg];
    } else {
      updated = agreements.map(ag => {
        if (ag.id === agreementId) {
          return {
            ...ag,
            status: 'Aktif' as const
          };
        }
        return ag;
      });
    }
    onUpdateAgreements(updated);
  };

  // Quick Action to reset active document back to Draft and clear electronic signatures
  const handleResetDocumentToDraft = (agreementId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin membatalkan keaktifan dokumen ini dan mengembalikannya ke status Draft? Tanda tangan elektronik kedua belah pihak akan dihapus agar dokumen dapat direvisi kembali.")) return;

    const updated = agreements.map(ag => {
      if (ag.id === agreementId) {
        return {
          ...ag,
          status: 'Draft' as const,
          signaturePembuat: undefined,
          signaturePenerima: undefined
        };
      }
      return ag;
    });

    onUpdateAgreements(updated);

    if (onAddNotification) {
      onAddNotification({
        id: `notif-pk-reset-${Date.now()}`,
        title: "Status PK Dikembalikan ke Draft",
        message: `Perjanjian Kinerja untuk ${activeDocumentAgreement.assignedToName} (${activeDocumentAgreement.level}) telah berhasil dikembalikan ke status Draft untuk direvisi.`,
        type: "info",
        timestamp: new Date().toISOString(),
        isRead: false
      });
    }
  };

  // Quick Action to delete the entire agreement document
  const handleDeleteAgreement = (agreementId: string) => {
    if (agreementId.startsWith('pk-temp-')) {
      alert("Dokumen ini masih berupa draft kosong sementara dan belum disimpan ke database.");
      return;
    }

    if (!window.confirm("Apakah Anda yakin ingin menghapus seluruh dokumen Perjanjian Kinerja ini beserta semua indikator sasaran dan tanda tangan di dalamnya secara permanen?")) return;

    const updated = agreements.filter(ag => ag.id !== agreementId);
    onUpdateAgreements(updated);

    if (onAddNotification) {
      onAddNotification({
        id: `notif-pk-deleted-${Date.now()}`,
        title: "Dokumen PK Dihapus",
        message: `Dokumen Perjanjian Kinerja untuk ${activeDocumentAgreement.assignedToName} (${activeDocumentAgreement.level}) telah berhasil dihapus sepenuhnya dari sistem.`,
        type: "critical",
        timestamp: new Date().toISOString(),
        isRead: false
      });
    }
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
              onClick={() => setActiveTab('dokumen')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                activeTab === 'dokumen' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dokumen PK
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
                const rootTargetVal = parseFloat(node.root.target) || 100;
                const rootReal = node.root.achievement || 0;
                const rootScore = Math.min(120, Math.round((rootReal / rootTargetVal) * 100));

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

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-black uppercase rounded-md border border-purple-200">
                              LEVEL 1 • KEPALA STASIUN
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {rootId}</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 leading-normal">{node.root.indicatorName}</h4>
                          <p className="text-[10px] text-slate-400">Penanggung Jawab: <span className="font-bold text-slate-600">{node.agreement.assignedToName}</span></p>
                        </div>
                      </div>

                      {/* Right Metrics / Actions */}
                      <div className="flex items-center flex-wrap gap-4 text-xs">
                        <div className="bg-white border border-slate-200/60 rounded-xl px-2.5 py-1">
                          <span className="text-[9px] text-slate-400 block font-mono">TARGET</span>
                          <span className="font-extrabold text-slate-700">{node.root.target} {node.root.unit}</span>
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
                            const l2TargetVal = parseFloat(l2.indicator.target) || 100;
                            const l2Real = l2.indicator.achievement || 0;
                            const l2Score = Math.min(120, Math.round((l2Real / l2TargetVal) * 100));

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

                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-extrabold uppercase rounded border border-blue-200">
                                          LEVEL 2 • {l2.agreement.level.toUpperCase()}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-mono">Parent ID: {l2.indicator.parentIndicatorId}</span>
                                      </div>
                                      <h5 className="text-xs font-bold text-slate-700 leading-normal">{l2.indicator.indicatorName}</h5>
                                      <p className="text-[10px] text-slate-400">Penerima Delegasi: <span className="font-extrabold text-indigo-600">{l2.agreement.assignedToName}</span></p>
                                    </div>
                                  </div>

                                  {/* Right values */}
                                  <div className="flex items-center flex-wrap gap-3 text-xs">
                                    <div className="bg-slate-50 border border-slate-150 rounded-lg px-2 py-0.5 text-center">
                                      <span className="text-[8px] text-slate-400 block font-mono leading-none">TARGET</span>
                                      <span className="font-extrabold text-slate-700 text-[11px]">{l2.indicator.target} {l2.indicator.unit}</span>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-150 rounded-lg px-2 py-0.5 text-center">
                                      <span className="text-[8px] text-slate-400 block font-mono leading-none">REALISASI</span>
                                      <div className="flex items-center gap-1">
                                        <input 
                                          type="number"
                                          value={l2.indicator.achievement}
                                          onChange={(e) => handleUpdateAchievement(l2.agreement.id, l2Id, parseFloat(e.target.value) || 0)}
                                          disabled={!canEditAgreement('Kabid Tata Usaha')}
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
                                      {canEditAgreement('Kabid Tata Usaha') && (
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
                                        const l3TargetVal = parseFloat(l3.indicator.target) || 100;
                                        const l3Real = l3.indicator.achievement || 0;
                                        const l3Score = Math.min(120, Math.round((l3Real / l3TargetVal) * 100));

                                        return (
                                          <div key={l3Id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50/20 p-2.5 rounded-lg border border-emerald-100/50 text-xs relative">
                                            
                                            {/* Visual cascade horizontal connector */}
                                            <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-px bg-indigo-100 border-dashed border-t" />

                                            <div className="space-y-0.5">
                                              <div className="flex items-center gap-1">
                                                <span className="px-1 py-0.2 bg-emerald-100 text-emerald-700 text-[8px] font-extrabold uppercase rounded">
                                                  LEVEL 3 • SASARAN PEGAWAI
                                                </span>
                                                <span className="text-[8px] text-slate-400 font-mono">Parent: {l3.indicator.parentIndicatorId}</span>
                                              </div>
                                              <h6 className="font-semibold text-slate-700">{l3.indicator.indicatorName}</h6>
                                              <p className="text-[10px] text-slate-400">Pegawai Pelaksana: <span className="font-extrabold text-emerald-600">{l3.agreement.assignedToName}</span></p>
                                            </div>

                                            {/* Level 3 right values */}
                                            <div className="flex items-center gap-3">
                                              <div className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center">
                                                <span className="text-[7px] text-slate-400 block font-mono leading-none">TARGET</span>
                                                <span className="font-bold text-slate-600 text-[10px]">{l3.indicator.target} {l3.indicator.unit}</span>
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
      ) : activeTab === 'dokumen' ? (
        
        // Document Tab
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Document Picker sidebar */}
          <div className="lg:col-span-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-xs space-y-4 h-fit">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider font-mono">Navigasi Dokumen PK</h3>
              <p className="text-[10px] text-slate-400">Pilih pejabat atau staf pegawai pelaksana untuk melihat, mengedit sasaran, dan menandatangani dokumen e-PK resmi.</p>
            </div>

            <div className="space-y-3">
              
              {/* Level 1 Button */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Pimpinan Stasiun</span>
                <button
                  onClick={() => { setSelectedDocLevel('Kepala Stasiun'); setSelectedDocEmployeeId(''); }}
                  className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all border flex items-center gap-2.5 ${
                    selectedDocLevel === 'Kepala Stasiun' 
                      ? 'bg-purple-50 text-purple-900 border-purple-200 ring-1 ring-purple-100' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Building className="w-4 h-4 text-purple-600 shrink-0" />
                  <div className="truncate">
                    <p className="font-extrabold">Kepala Stasiun Radio</p>
                    <p className="text-[10px] text-slate-500 font-mono leading-none mt-0.5 truncate">{identity.kepalaStasiunNama}</p>
                  </div>
                </button>
              </div>

              {/* Level 2 Buttons */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Para Ketua Tim / Kabag TU</span>
                <div className="space-y-1">
                  {level2Options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSelectedDocLevel(opt.value); setSelectedDocEmployeeId(''); }}
                      className={`w-full text-left p-2.5 rounded-xl text-[11px] font-bold transition-all border flex items-center gap-2 ${
                        selectedDocLevel === opt.value 
                          ? 'bg-blue-50 text-blue-900 border-blue-200 ring-1 ring-blue-100' 
                          : 'bg-white text-slate-600 border-slate-150 hover:bg-slate-50'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <div className="truncate">
                        <p className="truncate">
                          {opt.value === 'Kabid Tata Usaha' ? 'Kepala Bagian Tata Usaha' : opt.value}
                        </p>
                        <p className="text-[9px] text-slate-500 font-mono leading-none mt-0.5 truncate">
                          {opt.value === 'Kabid Tata Usaha' ? identity.kepalaBidangNama :
                           opt.value === 'Ketua Tim Siaran' ? identity.ketuaTimSiaranNama :
                           opt.value === 'Ketua Tim Pemberitaan' ? identity.ketuaTimPemberitaanNama :
                           opt.value === 'Ketua Tim Teknologi dan Media Baru' ? identity.ketuaTimTeknikNama :
                           opt.value === 'Ketua Tim Konten Media Baru' ? identity.ketuaTimKontenNama :
                           opt.value === 'Ketua Tim Layanan Pengembangan Usaha' ? identity.ketuaTimLayananNama : 'Belum Atur'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Level 3 Staf Pegawai */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Staf Pegawai (Capaian Kinerja)</span>
                {employees.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic">Belum ada data pegawai.</p>
                ) : (
                  <select
                    value={selectedDocEmployeeId}
                    onChange={(e) => { setSelectedDocLevel('Pegawai'); setSelectedDocEmployeeId(e.target.value); }}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 focus:outline-hidden"
                  >
                    <option value="">-- Pilih Staf Pegawai --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nama} ({emp.divisi})
                      </option>
                    ))}
                  </select>
                )}
              </div>

            </div>
          </div>

          {/* Document sheet container */}
          <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 relative overflow-hidden">
            
            {/* Quick Action bar above document */}
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-150">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-extrabold text-slate-700">Status Dokumen:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  activeDocumentAgreement.status === 'Aktif' 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {activeDocumentAgreement.status}
                </span>
              </div>

              <div className="flex gap-2 flex-wrap justify-end">
                {activeDocumentAgreement.status === 'Draft' && (
                  <button
                    onClick={() => handleApproveDocument(activeDocumentAgreement.id)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black rounded-xl transition-colors uppercase tracking-wide shadow-xs cursor-pointer"
                  >
                    Setujui & Aktifkan
                  </button>
                )}

                {activeDocumentAgreement.status === 'Aktif' && canEditAgreement(activeDocumentAgreement.level) && (
                  <button
                    onClick={() => handleResetDocumentToDraft(activeDocumentAgreement.id)}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black rounded-xl transition-colors uppercase tracking-wide shadow-xs cursor-pointer flex items-center gap-1"
                    title="Batalkan keaktifan dan edit kembali"
                  >
                    <X className="w-3 h-3" /> Kembalikan ke Draft
                  </button>
                )}

                {!activeDocumentAgreement.id.startsWith('pk-temp-') && canEditAgreement(activeDocumentAgreement.level) && (
                  <button
                    onClick={() => handleDeleteAgreement(activeDocumentAgreement.id)}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-750 text-white text-[10px] font-black rounded-xl transition-colors uppercase tracking-wide shadow-xs cursor-pointer flex items-center gap-1"
                    title="Hapus seluruh dokumen PK ini"
                  >
                    <Trash2 className="w-3 h-3" /> Hapus PK
                  </button>
                )}
                
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black rounded-xl transition-all uppercase tracking-wide flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak PK
                </button>
              </div>
            </div>

            {/* Print Area - Formal Legal Document style */}
            <div className="border border-slate-300 p-8 md:p-12 bg-white text-slate-900 shadow-inner rounded-xl space-y-6 font-serif max-w-2xl mx-auto printable-document">
              
              {/* Formal Letter Head (Kop Surat) */}
              <div className="text-center border-b-4 border-double border-slate-900 pb-4 relative space-y-1">
                <div className="absolute left-0 top-0 w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400 text-xs border border-slate-200 select-none">
                  LOGO
                </div>
                <h3 className="text-base font-black uppercase tracking-wide leading-tight">KEMENTERIAN KOMUNIKASI DAN INFORMATIKA</h3>
                <h4 className="text-sm font-black uppercase tracking-tight leading-tight">DIREKTORAT JENDERAL PENYIARAN</h4>
                <h2 className="text-md font-bold uppercase tracking-wider leading-none">{settings.namaInstansi.toUpperCase()}</h2>
                <p className="text-[9px] font-mono leading-none text-slate-500 not-italic">{settings.alamat} • Telp: {settings.noTelp}</p>
              </div>

              {/* Document Title */}
              <div className="text-center space-y-1 pt-2 font-serif">
                <h1 className="text-md font-black underline uppercase tracking-wider">PERJANJIAN KINERJA TAHUN {selectedYear}</h1>
                <p className="text-[10px] italic">Nomor: SPK/ST-RADIO/{selectedYear}/{activeDocumentAgreement.id.slice(-4).toUpperCase()}</p>
              </div>

              {/* Parties Intro Statement */}
              <div className="text-xs leading-relaxed space-y-3 font-serif">
                <p>Dalam rangka mewujudkan manajemen pemerintahan yang efektif, transparan, dan akuntabel serta berorientasi pada hasil, kami yang bertandatangan di bawah ini:</p>
                
                <div className="space-y-1.5 pl-4">
                  <div className="flex">
                    <span className="w-24 font-bold">Nama</span>
                    <span className="mr-2">:</span>
                    <span className="font-extrabold underline">{getSupervisorName(activeDocumentAgreement.level, activeDocumentAgreement.assignedToEmployeeId)}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 font-bold">Jabatan</span>
                    <span className="mr-2">:</span>
                    <span>{getSupervisorLevel(activeDocumentAgreement.level)}</span>
                  </div>
                  <p className="italic text-[10px] text-slate-500">Selanjutnya disebut sebagai <span className="font-bold">PIHAK PERTAMA (Atasan Langsung)</span></p>
                </div>

                <div className="space-y-1.5 pl-4 pt-1">
                  <div className="flex">
                    <span className="w-24 font-bold">Nama</span>
                    <span className="mr-2">:</span>
                    <span className="font-extrabold underline">{activeDocumentAgreement.assignedToName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 font-bold">Jabatan</span>
                    <span className="mr-2">:</span>
                    <span>{activeDocumentAgreement.level}</span>
                  </div>
                  <p className="italic text-[10px] text-slate-500">Selanjutnya disebut sebagai <span className="font-bold">PIHAK KEDUA (Penerima Tugas)</span></p>
                </div>

                <p>PIHAK PERTAMA berjanji akan memberikan supervisi dan dukungan yang diperlukan. PIHAK KEDUA berjanji akan mewujudkan target kinerja yang ditetapkan dalam lampiran perjanjian ini.</p>
              </div>

              {/* Target Objectives Table */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider font-sans">Lampiran Sasaran & Indikator Kinerja Utama:</p>
                
                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-[10px] font-sans text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-800 text-[9px] font-extrabold uppercase">
                        <th className="p-2 border-r border-slate-800 text-center w-8">No</th>
                        <th className="p-2 border-r border-slate-800">Sasaran / Indikator Kinerja Utama</th>
                        <th className="p-2 border-r border-slate-800 text-center w-20">Target</th>
                        <th className="p-2 border-r border-slate-800 text-center w-16 font-mono font-bold">Bobot (%)</th>
                        <th className="p-2 text-center w-12 print:hidden">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {activeDocumentAgreement.objectives.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400 italic">Belum ada indikator sasaran yang terdaftar untuk dokumen ini.</td>
                        </tr>
                      ) : (
                        activeDocumentAgreement.objectives.map((obj, i) => (
                          <tr key={obj.id} className="hover:bg-slate-50/50">
                            <td className="p-2 border-r border-slate-800 text-center font-mono font-bold">{i + 1}</td>
                            <td className="p-2 border-r border-slate-800">
                              <p className="font-bold text-slate-800">{obj.indicatorName}</p>
                              {obj.parentIndicatorId && (
                                <span className="text-[8px] px-1 py-0.1 bg-indigo-50 text-indigo-600 rounded font-bold uppercase tracking-wider">Kaskade</span>
                              )}
                            </td>
                            <td className="p-2 border-r border-slate-800 text-center font-extrabold">{obj.target} {obj.unit}</td>
                            <td className="p-2 border-r border-slate-800 text-center font-bold font-mono">{obj.weight}%</td>
                            <td className="p-2 text-center print:hidden">
                              {canEditAgreement(activeDocumentAgreement.level) ? (
                                <button
                                  onClick={() => handleDeleteIndicator(activeDocumentAgreement.id, obj.id)}
                                  className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded transition-colors"
                                  title="Batal / Hapus Sasaran"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mx-auto" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Hanya Baca</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dual Electronic Signatures Block */}
              <div className="pt-6 font-serif">
                <div className="grid grid-cols-2 gap-4 text-center text-xs">
                  
                  {/* Pihak Pertama (Atasan) */}
                  <div className="flex flex-col items-center">
                    <span className="font-bold block">PIHAK PERTAMA</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold leading-none block mt-0.5">{getSupervisorLevel(activeDocumentAgreement.level)}</span>
                    
                    <div className="h-16 flex items-center justify-center my-2 border border-dashed border-slate-200 rounded-lg w-full bg-slate-50/50">
                      {activeDocumentAgreement.signaturePembuat ? (
                        <img src={activeDocumentAgreement.signaturePembuat} alt="Signature Pembuat" className="max-h-full object-contain mix-blend-multiply" />
                      ) : (
                        <div className="p-2 w-full">
                          <SignaturePad
                            value=""
                            onChange={(dataUrl) => handleSignDocument(activeDocumentAgreement.id, 'pembuat', dataUrl)}
                            height={60}
                            label="Teken e-Signature Atasan"
                          />
                        </div>
                      )}
                    </div>
                    <span className="font-extrabold underline block">{getSupervisorName(activeDocumentAgreement.level, activeDocumentAgreement.assignedToEmployeeId)}</span>
                    <span className="text-[9px] text-slate-400 font-mono">NIP. 197805122003111002</span>
                  </div>

                  {/* Pihak Kedua (Pegawai / Penerima) */}
                  <div className="flex flex-col items-center">
                    <span className="font-bold block">PIHAK KEDUA</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold leading-none block mt-0.5">{activeDocumentAgreement.level}</span>
                    
                    <div className="h-16 flex items-center justify-center my-2 border border-dashed border-slate-200 rounded-lg w-full bg-slate-50/50">
                      {activeDocumentAgreement.signaturePenerima ? (
                        <img src={activeDocumentAgreement.signaturePenerima} alt="Signature Penerima" className="max-h-full object-contain mix-blend-multiply" />
                      ) : (
                        <div className="p-2 w-full">
                          <SignaturePad
                            value=""
                            onChange={(dataUrl) => handleSignDocument(activeDocumentAgreement.id, 'penerima', dataUrl)}
                            height={60}
                            label="Teken e-Signature Pihak Kedua"
                          />
                        </div>
                      )}
                    </div>
                    <span className="font-extrabold underline block">{activeDocumentAgreement.assignedToName}</span>
                    <span className="text-[9px] text-slate-400 font-mono">NIP. 198905222013111001</span>
                  </div>

                </div>
              </div>

            </div>

            {/* Inline Quick Form to Edit Agreement Objectives directly on document view */}
            {canEditAgreement(activeDocumentAgreement.level) ? (
              <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100 space-y-3">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  Kelola Indikator Dokumen Ini Secara Cepat
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2 space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Indikator Kinerja Utama (IKU)</label>
                    <input
                      type="text"
                      value={newIndicatorName}
                      onChange={(e) => setNewIndicatorName(e.target.value)}
                      placeholder="Contoh: Indeks Pemirsa Berita TV/Radio"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-bold focus:outline-hidden focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Target</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={newIndicatorTarget}
                        onChange={(e) => setNewIndicatorTarget(e.target.value)}
                        placeholder="95"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 font-bold text-center focus:outline-hidden"
                      />
                      <input
                        type="text"
                        value={newIndicatorUnit}
                        onChange={(e) => setNewIndicatorUnit(e.target.value)}
                        placeholder="%"
                        className="w-12 bg-white border border-slate-200 rounded-lg px-1 py-1.5 text-xs text-slate-700 font-bold text-center focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Bobot</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={newIndicatorWeight}
                        onChange={(e) => setNewIndicatorWeight(parseInt(e.target.value) || 25)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 font-bold text-center focus:outline-hidden"
                      />
                      <button
                        onClick={() => handleAddIndicator(activeDocumentAgreement.id)}
                        className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3 text-amber-800 text-xs">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="space-y-1">
                  <p className="font-extrabold">Akses Terbatas (Read-Only)</p>
                  <p className="text-[10px] text-amber-700 leading-normal">
                    Dokumen ini berada pada <span className="font-bold">{activeDocumentAgreement.level === 'Pegawai' ? 'Level 3 (Pegawai)' : 'Level 2 (Kabag/Ketua Tim)'}</span>. 
                    {activeDocumentAgreement.level === 'Pegawai' 
                      ? ' Pengeditan hanya diizinkan bagi Kepala Stasiun atau penerima delegasi Level 2 (Kabag/Ketua Tim) yang berwenang.'
                      : ' Pengeditan indikator Level 1 dan Level 2 hanya dapat dilakukan oleh Kepala Stasiun.'
                    }
                  </p>
                </div>
              </div>
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
                      const rootTargetVal = rootObj._scaledTargetVal !== undefined ? rootObj._scaledTargetVal : (parseFloat(rootObj.target) || 100);
                      const rootReal = rootObj.achievement || 0;
                      const rootScore = rootTargetVal > 0 ? Math.min(120, Math.round((rootReal / rootTargetVal) * 100)) : 0;
                      
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
                            <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                              <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    rootScore >= 90 ? 'bg-emerald-500' : rootScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(100, rootScore)}%` }}
                                />
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider font-mono ${
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
                                  const l2TargetVal = l2Obj._scaledTargetVal !== undefined ? l2Obj._scaledTargetVal : (parseFloat(l2Obj.target) || 100);
                                  const l2Real = l2Obj.achievement || 0;
                                  const l2Score = l2TargetVal > 0 ? Math.min(120, Math.round((l2Real / l2TargetVal) * 100)) : 0;

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

                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border shrink-0 font-mono ${
                                          l2Score >= 90 ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200' : 
                                          l2Score >= 50 ? 'bg-amber-50/80 text-amber-700 border-amber-200' : 
                                          'bg-rose-50/80 text-rose-700 border-rose-200'
                                        }`}>
                                          {l2Score}% Capaian
                                        </span>
                                      </div>

                                      {/* Level 3 Pegawai row list */}
                                      {level3Objects.length > 0 && (
                                        <div className="p-2.5 bg-slate-100/30 border-t border-slate-100">
                                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 pl-1">Kontributor Kinerja Pelaksana (Level 3 - Pegawai):</span>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {level3Objects.map(({ indicator: l3Obj, agreement: l3Ag }) => {
                                              const l3TargetVal = l3Obj._scaledTargetVal !== undefined ? l3Obj._scaledTargetVal : (parseFloat(l3Obj.target) || 100);
                                              const l3Real = l3Obj.achievement || 0;
                                              const l3Score = l3TargetVal > 0 ? Math.min(120, Math.round((l3Real / l3TargetVal) * 100)) : 0;

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

                                                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black font-mono shrink-0 \${
                                                      l3Score >= 90 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                      l3Score >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                      'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}>
                                                      {l3Score}%
                                                    </span>
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

    </div>
  );
}
