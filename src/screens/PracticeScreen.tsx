import React, { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { getSubjects, getUnits, getTopics, getTopicMastery } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { SugaryBook, SugaryCheck, SugaryAlert } from '../components/SugaryIcons';
import type { Subject, Unit, Topic, TopicMastery } from '../types/database';

interface PracticeScreenProps {
  onStartQuiz: (topicId: string, topicTitle: string) => void;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({ onStartQuiz }) => {
  const { user } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [masteryMap, setMasteryMap] = useState<Record<string, TopicMastery>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const subs = await getSubjects();
      if (subs.length > 0) {
        setSelectedSubject(subs[0]);
        const u = await getUnits(subs[0].id);
        setUnits(u);
        if (u.length > 0) {
          setSelectedUnit(u[0]);
          const t = await getTopics(u[0].id);
          setTopics(t);
        }
      }

      if (user?.id) {
        const masteries = await getTopicMastery(user.id);
        const map: Record<string, TopicMastery> = {};
        masteries.forEach((m) => {
          map[m.topic_id] = m;
        });
        setMasteryMap(map);
      }
      setLoading(false);
    }
    loadData();
  }, [user?.id]);

  const handleSelectUnit = async (unit: Unit) => {
    setSelectedUnit(unit);
    const t = await getTopics(unit.id);
    setTopics(t);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 text-[var(--dp-color-ink)]">
        <div className="w-10 h-10 rounded-full border-3 border-indigo-200 border-t-indigo-600 animate-spin mb-4"></div>
        <span className="text-sm font-bold text-slate-600">Loading syllabus inventory...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      
      {/* Subject Header Banner */}
      {selectedSubject && (
        <div className="bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/80 border border-indigo-100/90 shadow-[0_8px_24px_rgba(79,70,229,0.06)] p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white border border-indigo-200/80 shadow-xs">
              <SugaryBook size={36} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 text-xs font-extrabold text-indigo-700">
                  {selectedSubject.code}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  University Exam Syllabus
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {selectedSubject.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 max-w-xl">
                {selectedSubject.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs font-extrabold text-slate-800 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-xs self-start sm:self-auto">
            <span>3 Units</span>
            <span>·</span>
            <span>40 MCQs</span>
          </div>
        </div>
      )}

      {/* Unit Selector Pills */}
      <div className="bg-white border border-slate-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.02)] p-4 sm:p-6 rounded-3xl text-left">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 px-1">
          Select Syllabus Unit
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {units.map((unit, idx) => {
            const isSelected = selectedUnit?.id === unit.id;
            return (
              <button
                key={unit.id}
                type="button"
                onClick={() => handleSelectUnit(unit)}
                className={`p-4 rounded-2xl text-left transition-all duration-180 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-[0_6px_20px_rgba(79,70,229,0.35)] scale-[1.01]'
                    : 'bg-slate-50/80 border border-slate-200/80 text-slate-700 hover:bg-white hover:border-indigo-200 hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] font-extrabold uppercase tracking-wider ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                    Unit 0{idx + 1}
                  </span>
                  {isSelected && <span className="h-2 w-2 rounded-full bg-amber-300" />}
                </div>
                <div className={`text-base font-extrabold leading-snug ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {unit.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Topics List in Unit */}
      {selectedUnit && (
        <div className="bg-white border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8 rounded-3xl text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
                Topics under {selectedUnit.title}
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">
                Practice MCQs by Topic
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              10 MCQs · Instant rationales · +10 XP per hit
            </span>
          </div>

          <div className="space-y-3">
            {topics.map((topic, idx) => {
              const mastery = masteryMap[topic.id];
              const hasAttempts = mastery && mastery.total_attempts > 0;
              const isWeak = hasAttempts && mastery.needs_revision;

              return (
                <div
                  key={topic.id}
                  className="bg-white hover:bg-slate-50/60 border border-slate-200/80 hover:border-indigo-200 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-180 hover:shadow-xs"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-mono font-black text-sm text-slate-700">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        {topic.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {selectedUnit?.title} · Topic {topic.order_index}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    {hasAttempts ? (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                          isWeak
                            ? 'bg-rose-50 border border-rose-200 text-rose-800'
                            : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        }`}
                      >
                        {isWeak ? (
                          <>
                            <SugaryAlert size={14} />
                            <span>{mastery.accuracy}% · Weak</span>
                          </>
                        ) : (
                          <>
                            <SugaryCheck size={14} />
                            <span>{mastery.accuracy}% · Mastered</span>
                          </>
                        )}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-slate-500 bg-slate-100">
                        New topic
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => onStartQuiz(topic.id, topic.title)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Quiz</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
