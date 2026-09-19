'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAuthStore } from '@/store/authStore';
import {
  TrendingUp,
  RefreshCw,
  Star,
  CheckCircle2,
  Award,
  Search,
  RotateCcw,
  Calendar,
  X,
  Eye,
  Target,
  Flag,
  FileText,
  UserCheck,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Building2,
  User,
  HelpCircle,
  Lock,
} from 'lucide-react';

interface PerformanceGoal {
  id?: string;
  title: string;
  description?: string;
  target?: string;
  progress?: string | number;
  dueDate?: string;
  status?: string; // 'Completed' | 'In Progress' | 'Not Started' | 'Overdue'
  completionPercentage?: number;
}

interface PerformanceReview {
  _id?: string;
  id?: string;
  organizationId?: string;
  employeeId?: string;
  employeeName?: string;
  reviewer?: string;
  reviewPeriod?: string;
  cycle?: string;
  reviewDate?: string;
  createdAt?: string;
  rating?: number | string;
  score?: number | string;
  feedback?: string;
  managerNotes?: string;
  status?: string;
  goals?: (PerformanceGoal | string)[];
  selfAssessment?: string;
  strengths?: string | string[];
  improvements?: string | string[];
  achievements?: string | string[];
}

export default function EmployeePerformancePage() {
  const { user } = useAuthStore();

  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Detail Modal State
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchPerformance = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setIsError(false);
    setErrorMessage(null);

    try {
      const [perfRes, meRes] = await Promise.all([
        fetch('/api/v1/performance').catch(() => null),
        fetch('/api/v1/auth/me').catch(() => null),
      ]);

      if (meRes && meRes.ok) {
        const meData = await meRes.json();
        if (meData.success && meData.user) {
          setProfileData(meData.user);
        }
      }

      if (perfRes && perfRes.ok) {
        const data = await perfRes.json();
        if (data.success && Array.isArray(data.data)) {
          setReviews(data.data);
          if (isManualRefresh) {
            showToast('Performance records refreshed successfully');
          }
        } else {
          setReviews([]);
        }
      } else {
        setIsError(true);
        setErrorMessage('Unable to load performance records. Please try again.');
      }
    } catch (err: any) {
      console.error('Error fetching employee performance records:', err);
      setIsError(true);
      setErrorMessage(err?.message || 'A network error occurred while fetching performance data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  // Handle ESC key for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedReview(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute Available Filter Options
  const periodOptions = useMemo(() => {
    const set = new Set<string>();
    reviews.forEach((r) => {
      const p = r.reviewPeriod || r.cycle;
      if (p) set.add(p);
    });
    return Array.from(set);
  }, [reviews]);

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    reviews.forEach((r) => {
      if (r.status) set.add(r.status);
    });
    return Array.from(set);
  }, [reviews]);

  // Filter & Search Logic
  const filteredReviews = useMemo(() => {
    return reviews.filter((rev) => {
      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cycleText = (rev.reviewPeriod || rev.cycle || '').toLowerCase();
        const reviewerText = (rev.reviewer || '').toLowerCase();
        const feedbackText = (rev.feedback || rev.managerNotes || '').toLowerCase();
        const statusText = (rev.status || '').toLowerCase();

        const matchesQuery =
          cycleText.includes(q) ||
          reviewerText.includes(q) ||
          feedbackText.includes(q) ||
          statusText.includes(q);

        if (!matchesQuery) return false;
      }

      // Review Period Filter
      if (filterPeriod !== 'All') {
        const p = rev.reviewPeriod || rev.cycle || '';
        if (p !== filterPeriod) return false;
      }

      // Status Filter
      if (filterStatus !== 'All') {
        if ((rev.status || '') !== filterStatus) return false;
      }

      return true;
    });
  }, [reviews, searchQuery, filterPeriod, filterStatus]);

  // Pagination Calculations
  const totalPages = Math.ceil(filteredReviews.length / pageSize) || 1;
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReviews.slice(start, start + pageSize);
  }, [filteredReviews, currentPage, pageSize]);

  const isFiltered = searchQuery.trim() !== '' || filterPeriod !== 'All' || filterStatus !== 'All';

  const resetFilters = () => {
    setSearchQuery('');
    setFilterPeriod('All');
    setFilterStatus('All');
    setCurrentPage(1);
  };

  // KPI Calculations derived strictly from real data
  const summaryKPIs = useMemo(() => {
    if (reviews.length === 0) {
      return {
        avgRating: 'N/A',
        latestStatus: 'N/A',
        totalGoalsCount: 0,
        lastReviewDate: 'N/A',
      };
    }

    // Rating / Score
    const numericRatings = reviews
      .map((r) => {
        const val = r.rating !== undefined ? Number(r.rating) : r.score !== undefined ? Number(r.score) : NaN;
        return isNaN(val) ? null : val;
      })
      .filter((v): v is number => v !== null);

    let avgRatingStr = 'N/A';
    if (numericRatings.length > 0) {
      const avg = numericRatings.reduce((a, b) => a + b, 0) / numericRatings.length;
      avgRatingStr = avg <= 5 ? `${avg.toFixed(1)} / 5.0` : `${Math.round(avg)}%`;
    } else {
      const firstStrRating = reviews.find((r) => r.rating || r.score);
      if (firstStrRating) {
        avgRatingStr = String(firstStrRating.rating || firstStrRating.score);
      }
    }

    // Latest Status
    const latestReview = reviews[0];
    const latestStatus = latestReview?.status || 'Completed';

    // Total Assigned Goals
    let totalGoalsCount = 0;
    reviews.forEach((r) => {
      if (Array.isArray(r.goals)) {
        totalGoalsCount += r.goals.length;
      }
    });

    // Last Review Date
    const lastReviewDate = latestReview?.reviewDate || latestReview?.createdAt || 'N/A';

    return {
      avgRating: avgRatingStr,
      latestStatus,
      totalGoalsCount,
      lastReviewDate,
    };
  }, [reviews]);

  // Extract all goals from all reviews if available
  const allExtractedGoals = useMemo(() => {
    const goalsList: { goal: PerformanceGoal; cycle: string }[] = [];
    reviews.forEach((r) => {
      if (Array.isArray(r.goals)) {
        r.goals.forEach((g) => {
          if (typeof g === 'object' && g !== null && g.title) {
            goalsList.push({ goal: g as PerformanceGoal, cycle: r.reviewPeriod || r.cycle || 'Appraisal Cycle' });
          } else if (typeof g === 'string' && g.trim()) {
            goalsList.push({
              goal: {
                title: g,
                status: 'In Progress',
                completionPercentage: 50,
              },
              cycle: r.reviewPeriod || r.cycle || 'Appraisal Cycle',
            });
          }
        });
      }
    });
    return goalsList;
  }, [reviews]);

  // Display User Identity Context
  const employeeName = profileData?.name || user?.name || 'Employee';
  const employeeId = profileData?.employeeId || user?.employeeId || 'N/A';
  const designation = profileData?.designation || user?.designation || 'Team Member';
  const department = profileData?.department || user?.department || 'General';

  // Status Badge Formatting Helper
  const getStatusBadge = (statusStr?: string) => {
    const s = (statusStr || 'Completed').toUpperCase();
    if (s.includes('COMPLETED') || s.includes('PUBLISHED') || s.includes('APPROVED')) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          <span>{statusStr || 'Completed'}</span>
        </span>
      );
    }
    if (s.includes('PROGRESS') || s.includes('PENDING') || s.includes('SUBMITTED')) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
          <TrendingUp className="h-3 w-3 text-amber-600" />
          <span>{statusStr || 'In Progress'}</span>
        </span>
      );
    }
    if (s.includes('DRAFT')) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-300">
          <FileText className="h-3 w-3 text-slate-500" />
          <span>{statusStr || 'Draft'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
        <Sparkles className="h-3 w-3 text-indigo-600" />
        <span>{statusStr || 'Reviewed'}</span>
      </span>
    );
  };

  return (
    <AuthGuard allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}>
      <AdminLayout
        allowedRoles={['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']}
        pageTitle="My Performance"
        breadcrumbs={[
          { label: 'My Workspace', href: '/employee/dashboard' },
          { label: 'Performance', href: '/employee/performance' },
        ]}
      >
        <div className="space-y-6 pb-12">
          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl animate-fade-in border border-slate-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* PAGE HEADER & USER CONTEXT BADGE */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Performance</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-extrabold text-indigo-700 border border-indigo-200/80">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                  Official Employee Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                View published manager review ratings, appraisal scores, manager feedback, and assigned performance goals.
              </p>

              {/* Employee Context Pill */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1 border border-slate-200/80">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-bold text-slate-800">{employeeName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({employeeId})</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1 border border-slate-200/80">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>{designation}</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-700">{department}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => fetchPerformance(true)}
                disabled={isRefreshing || isLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                title="Refresh performance records from database"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh History'}</span>
              </button>
            </div>
          </div>

          {/* ERROR ALERT BANNER */}
          {isError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <div>
                  <p className="font-bold text-rose-900">Failed to Load Performance Data</p>
                  <p className="text-rose-700 mt-0.5">{errorMessage || 'An error occurred while connecting to the performance service.'}</p>
                </div>
              </div>
              <button
                onClick={() => fetchPerformance(true)}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors shrink-0 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* PERFORMANCE SUMMARY KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Performance Rating / Score */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Rating / Score</span>
                <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 border border-indigo-100">
                  <Star className="h-5 w-5 fill-indigo-100" />
                </div>
              </div>
              <div className="mt-3">
                {isLoading ? (
                  <div className="h-7 w-24 bg-slate-200 animate-pulse rounded-md"></div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{summaryKPIs.avgRating}</span>
                  </div>
                )}
                <p className="text-[11px] font-medium text-slate-400 mt-1">Average rating across cycles</p>
              </div>
            </div>

            {/* Card 2: Latest Review Status */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Latest Review Status</span>
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 border border-emerald-100">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                {isLoading ? (
                  <div className="h-7 w-24 bg-slate-200 animate-pulse rounded-md"></div>
                ) : (
                  <div>
                    {getStatusBadge(summaryKPIs.latestStatus)}
                  </div>
                )}
                <p className="text-[11px] font-medium text-slate-400 mt-2">Most recent appraisal cycle</p>
              </div>
            </div>

            {/* Card 3: Assigned Goals & OKRs */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Assigned Goals / OKRs</span>
                <div className="rounded-xl bg-amber-50 p-2 text-amber-600 border border-amber-100">
                  <Target className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                {isLoading ? (
                  <div className="h-7 w-20 bg-slate-200 animate-pulse rounded-md"></div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{summaryKPIs.totalGoalsCount}</span>
                    <span className="text-xs text-slate-500 font-semibold">goals</span>
                  </div>
                )}
                <p className="text-[11px] font-medium text-slate-400 mt-1">Key performance objectives</p>
              </div>
            </div>

            {/* Card 4: Last Review Date */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Last Review Date</span>
                <div className="rounded-xl bg-slate-100 p-2 text-slate-600 border border-slate-200">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3">
                {isLoading ? (
                  <div className="h-7 w-24 bg-slate-200 animate-pulse rounded-md"></div>
                ) : (
                  <span className="text-base font-extrabold text-slate-900 tracking-tight truncate block">
                    {summaryKPIs.lastReviewDate}
                  </span>
                )}
                <p className="text-[11px] font-medium text-slate-400 mt-1">Official evaluation publication</p>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER CONTROLS */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by review cycle, reviewer name, or feedback..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Period Filter */}
                <select
                  value={filterPeriod}
                  onChange={(e) => {
                    setFilterPeriod(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  <option value="All">All Cycles</option>
                  {periodOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                {/* Reset Filters */}
                {isFiltered && (
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Filter Count Badge */}
            {isFiltered && (
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                <span>
                  Showing <strong className="text-slate-800">{filteredReviews.length}</strong> of{' '}
                  <strong className="text-slate-800">{reviews.length}</strong> performance reviews
                </span>
              </div>
            )}
          </div>

          {/* MAIN CONTENT: REVIEWS TABLE & MOBILE CARDS */}
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <div className="border-b border-slate-200/80 bg-slate-50/60 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                <h2 className="text-sm font-extrabold text-slate-800">Performance Review History</h2>
              </div>
              <span className="text-xs text-slate-500 font-semibold">
                {filteredReviews.length} {filteredReviews.length === 1 ? 'record' : 'records'}
              </span>
            </div>

            {isLoading ? (
              /* SKELETON LOADER */
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="animate-pulse flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
                      <div className="h-3 w-48 bg-slate-100 rounded-md"></div>
                    </div>
                    <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              /* ZERO DATA EMPTY STATE */
              <div className="p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
                  <Award className="h-7 w-7 text-slate-300" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No appraisal records found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed font-medium">
                  Your performance reviews and scores will appear here when your manager publishes them.
                </p>
                <p className="text-[11px] text-slate-400 mt-2 italic font-medium">
                  Performance goals will also appear here when assigned.
                </p>
              </div>
            ) : filteredReviews.length === 0 ? (
              /* SEARCH FILTER EMPTY STATE */
              <div className="p-10 text-center text-xs text-slate-500">
                <Search className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700 text-sm">No matching performance reviews</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your search keywords or filter criteria.</p>
                <button
                  onClick={resetFilters}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Clear All Filters</span>
                </button>
              </div>
            ) : (
              <div>
                {/* DESKTOP TABLE VIEW (>= 640px) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-5">Cycle / Period</th>
                        <th className="py-3.5 px-4">Rating / Score</th>
                        <th className="py-3.5 px-4">Reviewer</th>
                        <th className="py-3.5 px-4">Review Date</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Feedback Summary</th>
                        <th className="py-3.5 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {paginatedReviews.map((rev) => {
                        const cycleName = rev.reviewPeriod || rev.cycle || 'Performance Review';
                        const scoreDisplay =
                          rev.rating !== undefined
                            ? rev.rating
                            : rev.score !== undefined
                            ? `${rev.score}%`
                            : '--';
                        const reviewerName = rev.reviewer || 'Reporting Manager';
                        const reviewDateStr = rev.reviewDate || rev.createdAt || 'N/A';
                        const feedbackPreview = rev.feedback || rev.managerNotes || 'No summary feedback attached.';

                        return (
                          <tr key={rev._id || rev.id || Math.random().toString()} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-5 font-bold text-slate-900">{cycleName}</td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1 text-amber-600 font-bold">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                                <span>{scoreDisplay}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-700">
                              <div className="flex items-center gap-1.5">
                                <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                                <span>{reviewerName}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-500">{reviewDateStr}</td>
                            <td className="py-3.5 px-4">{getStatusBadge(rev.status)}</td>
                            <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={feedbackPreview}>
                              {feedbackPreview}
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <button
                                onClick={() => setSelectedReview(rev)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer shadow-2xs"
                              >
                                <Eye className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600" />
                                <span>View Details</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE CARD VIEW (< 640px) */}
                <div className="block sm:hidden divide-y divide-slate-100">
                  {paginatedReviews.map((rev) => {
                    const cycleName = rev.reviewPeriod || rev.cycle || 'Performance Review';
                    const scoreDisplay =
                      rev.rating !== undefined ? rev.rating : rev.score !== undefined ? `${rev.score}%` : '--';
                    const reviewerName = rev.reviewer || 'Reporting Manager';
                    const reviewDateStr = rev.reviewDate || rev.createdAt || 'N/A';
                    const feedbackPreview = rev.feedback || rev.managerNotes || 'No summary feedback attached.';

                    return (
                      <div key={rev._id || rev.id || Math.random().toString()} className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-extrabold text-sm text-slate-900 block">{cycleName}</span>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                              <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                              <span>{reviewerName}</span>
                            </div>
                          </div>
                          <div>{getStatusBadge(rev.status)}</div>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-xs">
                          <span className="text-slate-500 font-medium">Rating / Score:</span>
                          <div className="flex items-center gap-1 text-amber-600 font-extrabold">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                            <span>{scoreDisplay}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                          &quot;{feedbackPreview}&quot;
                        </p>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-slate-400 font-mono">Date: {reviewDateStr}</span>
                          <button
                            onClick={() => setSelectedReview(rev)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 text-indigo-400" />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PAGINATION BAR */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-200/80 px-5 py-3 text-xs text-slate-500 bg-slate-50/40">
                    <span>
                      Page <strong className="text-slate-800">{currentPage}</strong> of{' '}
                      <strong className="text-slate-800">{totalPages}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span>Previous</span>
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ASSIGNED GOALS & OKRS SECTION (Rendered if real goals exist) */}
          {!isLoading && allExtractedGoals.length > 0 && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Target className="h-4.5 w-4.5 text-amber-600" />
                <h2 className="text-sm font-extrabold text-slate-900">Assigned Performance Goals & OKRs</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allExtractedGoals.map((item, idx) => {
                  const g = item.goal;
                  const pct = typeof g.completionPercentage === 'number' ? g.completionPercentage : 50;
                  const goalStatus = g.status || 'In Progress';

                  return (
                    <div key={idx} className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">{g.title}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{item.cycle}</span>
                        </div>
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200 shrink-0">
                          {goalStatus}
                        </span>
                      </div>

                      {g.description && <p className="text-xs text-slate-600 line-clamp-2">{g.description}</p>}

                      {/* Progress Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                          <span>Target: {g.target || 'Met Objectives'}</span>
                          <span className="font-mono text-indigo-600">{pct}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* READ-ONLY REVIEW DETAILS MODAL */}
          {selectedReview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-fade-in">
              <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-6">
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-extrabold text-slate-900">
                        {selectedReview.reviewPeriod || selectedReview.cycle || 'Performance Review'}
                      </h3>
                      {getStatusBadge(selectedReview.status)}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Evaluated by <strong className="text-slate-800">{selectedReview.reviewer || 'Reporting Manager'}</strong> on{' '}
                      <span className="font-mono">{selectedReview.reviewDate || selectedReview.createdAt || 'N/A'}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Score & Rating Callout Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200/80">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Performance Rating</span>
                    <div className="flex items-center gap-1.5 text-amber-600 font-extrabold text-xl mt-1">
                      <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
                      <span>{selectedReview.rating !== undefined ? selectedReview.rating : selectedReview.score !== undefined ? `${selectedReview.score}%` : 'N/A'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Evaluation Status</span>
                    <div className="mt-1 font-bold text-slate-800 text-sm">
                      {selectedReview.status || 'Completed'}
                    </div>
                  </div>
                </div>

                {/* Manager Feedback Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Manager Evaluation & Feedback</h4>
                  </div>
                  <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-medium">
                    {selectedReview.feedback || selectedReview.managerNotes || 'No manager feedback remarks recorded for this evaluation cycle.'}
                  </div>
                </div>

                {/* Self-Assessment Section (If present) */}
                {selectedReview.selfAssessment && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-emerald-600" />
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Submitted Self-Assessment</h4>
                    </div>
                    <div className="rounded-xl bg-emerald-50/40 p-4 border border-emerald-200/60 text-xs text-slate-700 leading-relaxed">
                      {selectedReview.selfAssessment}
                    </div>
                  </div>
                )}

                {/* Goals attached to this specific review */}
                {Array.isArray(selectedReview.goals) && selectedReview.goals.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-amber-600" />
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Assigned Cycle Goals</h4>
                    </div>
                    <div className="space-y-2">
                      {selectedReview.goals.map((g, gIdx) => {
                        const titleStr = typeof g === 'object' && g.title ? g.title : String(g);
                        const statusStr = typeof g === 'object' && g.status ? g.status : 'Assigned';
                        return (
                          <div key={gIdx} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium">
                            <span className="text-slate-800 font-semibold">{titleStr}</span>
                            <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              {statusStr}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Read-Only Official Evaluation Record</span>
                  </div>
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
