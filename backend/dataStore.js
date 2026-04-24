// backend/dataStore.js

// In-memory arrays (reset on server restart)
export const workers = [];
export const employers = [];

// Add a worker profile
export function addWorker(worker) {
  // simple id generator
  const id = workers.length + 1;
  const newWorker = { id, ...worker };
  workers.push(newWorker);
  return newWorker;
}

// List workers with optional filters
export function listWorkers(filters = {}) {
  const { cityArea, minExperience, maxSalary, skill } = filters;

  return workers.filter((w) => {
    if (cityArea && w.cityArea && w.cityArea.toLowerCase() !== cityArea.toLowerCase()) {
      return false;
    }
    if (minExperience && w.experienceYears && w.experienceYears < Number(minExperience)) {
      return false;
    }
    if (maxSalary && w.expectedSalary && w.expectedSalary > Number(maxSalary)) {
      return false;
    }
    if (skill && w.skills && w.skills.length) {
      const skillLower = skill.toLowerCase();
      const hasSkill = w.skills.some((s) => String(s).toLowerCase().includes(skillLower));
      if (!hasSkill) return false;
    }
    return true;
  });
}