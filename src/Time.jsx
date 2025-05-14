import React, { useState, useEffect } from 'react';
import {
  TrashIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  PlusIcon,
  MinusIcon,
} from '@heroicons/react/24/solid';

const TimerApp = () => {
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('projects');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map(project => ({
        ...project,
        timeEntries: project.timeEntries || [],
      }));
    }
    return [];
  });
  const [currentProject, setCurrentProject] = useState('');
  const [timeLimits, setTimeLimits] = useState(() => {
    const saved = localStorage.getItem('timeLimits');
    return saved ? JSON.parse(saved) : {};
  });
  const [timeView, setTimeView] = useState('day'); // 'day', 'week', 'month'

  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('timeLimits', JSON.stringify(timeLimits));
  }, [timeLimits]);

  const addProject = () => {
    if (!currentProject.trim()) return;
    const newProject = {
      id: Date.now(),
      name: currentProject,
      time: 0,
      isRunning: false,
      lastStart: null,
      timeEntries: [],
    };
    setProjects([...projects, newProject]);
    setCurrentProject('');
  };

  const toggleTimer = (id, action) => {
    setProjects(projects.map(project => {
      if (project.id !== id) return project;

      if (action === 'start') {
        return { ...project, isRunning: true, lastStart: Date.now() };
      }

      if (action === 'pause') {
        const elapsed = Math.floor((Date.now() - project.lastStart) / 1000);
        return {
          ...project,
          time: project.time + elapsed,
          isRunning: false,
          lastStart: null,
          timeEntries: [
            ...project.timeEntries,
            { timestamp: Date.now(), duration: elapsed },
          ],
        };
      }

      if (action === 'stop') {
        const elapsed = project.isRunning
          ? Math.floor((Date.now() - project.lastStart) / 1000)
          : 0;
        return {
          ...project,
          time: project.time + elapsed,
          isRunning: false,
          lastStart: null,
          timeEntries: elapsed
            ? [
                ...project.timeEntries,
                { timestamp: Date.now(), duration: elapsed },
              ]
            : project.timeEntries,
        };
      }

      return project;
    }));
  };

  const deleteProject = (id) => {
    setProjects(projects.filter(project => project.id !== id));
    setTimeLimits(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  const setInitialTime = (id, hours, minutes) => {
    const totalSeconds = (Number(hours) || 0) * 3600 + (Number(minutes) || 0) * 60;
    setProjects(projects.map(project => {
      if (project.id !== id) return project;
      return { ...project, time: totalSeconds };
    }));
  };

  const setLimit = (id, limitMinutes) => {
    const limit = limitMinutes ? Math.max(1, parseInt(limitMinutes)) * 60 : 0;
    setTimeLimits(prev => ({ ...prev, [id]: limit }));
  };

  const adjustTimeLimit = (id, hours) => {
    setTimeLimits(prev => {
      const currentLimitMinutes = prev[id] ? prev[id] / 60 : 0;
      const newLimitMinutes = Math.max(1, currentLimitMinutes + hours * 60);
      return { ...prev, [id]: newLimitMinutes * 60 };
    });
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return { hours, minutes };
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setProjects(prev =>
        prev.map(project => {
          if (!project.isRunning) return project;
          const elapsed = Math.floor((Date.now() - project.lastStart) / 1000);
          return {
            ...project,
            time: project.time + elapsed,
            lastStart: Date.now(),
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getTimeInPeriod = (entries, period) => {
    if (!Array.isArray(entries)) return 0;

    const now = Date.now();
    let startTime;

    if (period === 'day') {
      startTime = new Date(now).setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      const date = new Date(now);
      startTime = date.setDate(date.getDate() - date.getDay());
      startTime = new Date(startTime).setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      startTime = new Date(now).setDate(1);
      startTime = new Date(startTime).setHours(0, 0, 0, 0);
    }

    return entries.reduce((total, entry) => {
      if (entry.timestamp >= startTime) {
        return total + entry.duration;
      }
      return total;
    }, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-16 tracking-tight">
          TimeSync Pro
        </h1>

        {/* Add Project Form */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <input
            value={currentProject}
            onChange={e => setCurrentProject(e.target.value)}
            placeholder="New project name"
            className="rounded-lg px-5 py-3 w-full sm:w-80 bg-white text-gray-900 ring-1 ring-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
            aria-label="New project name"
          />
          <button
            onClick={addProject}
            className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:from-indigo-700 hover:to-indigo-800 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-300 transform"
            aria-label="Add project"
          >
            <PlusIcon className="h-5 w-5 inline-block mr-2" />
            Add Project
          </button>
        </div>

        {/* Project List */}
        <div className="space-y-8">
          {projects.map(project => {
            const { hours, minutes } = formatTime(project.time);
            return (
              <div
                key={project.id}
                className="bg-white p-8 rounded-2xl shadow-xl transition duration-300 hover:shadow-2xl hover:scale-[1.02] transform"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <h2 className="text-xl font-bold text-gray-900">{project.name}</h2>
                  <div className="flex items-center gap-6">
                    <span className="text-sm font-medium text-gray-600">
                      {hours}h {minutes}m
                    </span>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="text-gray-500 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 transition duration-300"
                      aria-label={`Delete ${project.name}`}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                {timeLimits[project.id] && (
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between text-sm font-medium text-gray-600">
                      <span>Progress</span>
                      <span>
                        {((project.time / timeLimits[project.id]) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-indigo-700 h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(Math.max((project.time / timeLimits[project.id]) * 100, 0), 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Timer Controls */}
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => toggleTimer(project.id, 'start')}
                    disabled={project.isRunning}
                    className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium shadow-md transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      project.isRunning
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 focus:ring-emerald-500'
                    } ${project.isRunning ? '' : 'animate-pulse'}`}
                    aria-label={`Start timer for ${project.name}`}
                  >
                    <PlayIcon className="h-5 w-5" />
                    Start
                  </button>
                  <button
                    onClick={() => toggleTimer(project.id, 'pause')}
                    disabled={!project.isRunning}
                    className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium shadow-md transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      !project.isRunning
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 focus:ring-amber-500'
                    }`}
                    aria-label={`Pause timer for ${project.name}`}
                  >
                    <PauseIcon className="h-5 w-5" />
                    Pause
                  </button>
                  <button
                    onClick={() => toggleTimer(project.id, 'stop')}
                    className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white px-5 py-3 rounded-lg font-medium shadow-md hover:from-rose-600 hover:to-rose-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition duration-300 transform"
                    aria-label={`Stop timer for ${project.name}`}
                  >
                    <StopIcon className="h-5 w-5" />
                    Stop
                  </button>
                </div>

                {/* Initial Time */}
                <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <label className="text-sm font-medium text-gray-600 w-28">
                    Initial Time:
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      value={hours}
                      onChange={e => setInitialTime(project.id, e.target.value, minutes)}
                      placeholder="Hours"
                      className="rounded-lg px-4 py-2 w-20 bg-white text-gray-900 ring-1 ring-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
                      aria-label={`Hours for ${project.name}`}
                    />
                    <span className="text-sm text-gray-600">h</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={minutes}
                      onChange={e => setInitialTime(project.id, hours, e.target.value)}
                      placeholder="Min"
                      className="rounded-lg px-4 py-2 w-20 bg-white text-gray-900 ring-1 ring-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
                      aria-label={`Minutes for ${project.name}`}
                    />
                    <span className="text-sm text-gray-600">m</span>
                  </div>
                </div>

                {/* Time Limit */}
                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <label className="text-sm font-medium text-gray-600 w-28">
                    Time Limit:
                  </label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => adjustTimeLimit(project.id, -1)}
                      className="flex items-center gap-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:from-gray-600 hover:to-gray-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-300 transform"
                      aria-label={`Decrease time limit for ${project.name} by 1 hour`}
                    >
                      <MinusIcon className="h-5 w-5" />
                      Hour
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={timeLimits[project.id] ? timeLimits[project.id] / 60 : ''}
                      onChange={e => setLimit(project.id, e.target.value)}
                      placeholder="Min"
                      className="rounded-lg px-4 py-2 w-20 bg-white text-gray-900 ring-1 ring-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
                      aria-label={`Time limit in minutes for ${project.name}`}
                    />
                    <button
                      onClick={() => adjustTimeLimit(project.id, 1)}
                      className="flex items-center gap-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-lg font-medium shadow-md hover:from-gray-600 hover:to-gray-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-300 transform"
                      aria-label={`Increase time limit for ${project.name} by 1 hour`}
                    >
                      <PlusIcon className="h-5 w-5" />
                      Hour
                    </button>
                    {timeLimits[project.id] && (
                      <span className="text-sm font-medium text-gray-600">
                        {Math.max(0, ((timeLimits[project.id] - project.time) / 3600).toFixed(1))}h left
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Time Breakdown */}
        {projects.length > 0 && (
          <div className="mt-16 bg-white p-8 rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Time Breakdown</h2>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {['day', 'week', 'month'].map(period => (
                <button
                  key={period}
                  onClick={() => setTimeView(period)}
                  className={`px-5 py-2 rounded-lg font-medium transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    timeView === period
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  aria-label={`View ${period} breakdown`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {projects.map(project => (
                <div
                  key={project.id}
                  className="flex justify-between items-center py-3 border-b border-gray-100"
                >
                  <span className="text-base font-medium text-gray-900">{project.name}</span>
                  <span className="text-sm font-medium text-gray-600">
                    {(getTimeInPeriod(project.timeEntries, timeView) / 3600).toFixed(1)}h
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimerApp;