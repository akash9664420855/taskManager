import { connectDB, disconnectDB } from './config/db';
import { User } from './models/User';
import { Project } from './models/Project';
import { Task } from './models/Task';
import { Comment } from './models/Comment';

const PASSWORD = 'Password123!';

const userData = [
  { name: 'Ava Admin', email: 'admin@demo.test', role: 'admin' as const, avatarUrl: avatar('Ava Admin', 'e11d48') },
  { name: 'Maya Manager', email: 'maya@demo.test', role: 'manager' as const, avatarUrl: avatar('Maya Manager', '6366f1') },
  { name: 'Marco Manager', email: 'marco@demo.test', role: 'manager' as const, avatarUrl: avatar('Marco Manager', '0ea5e9') },
  { name: 'Nora Newcomer', email: 'nora@demo.test', role: 'member' as const, avatarUrl: avatar('Nora Newcomer', '10b981') },
  { name: 'Sam Strider', email: 'sam@demo.test', role: 'member' as const, avatarUrl: avatar('Sam Strider', 'f59e0b') },
  { name: 'Theo Tinker', email: 'theo@demo.test', role: 'member' as const, avatarUrl: avatar('Theo Tinker', '8b5cf6') },
  { name: 'Ren Reviewer', email: 'ren@demo.test', role: 'member' as const, avatarUrl: avatar('Ren Reviewer', 'ec4899') },
];

function avatar(name: string, color: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=${color}&radius=50`;
}

function daysFromNow(d: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + d);
  return date;
}

async function run() {
  console.log('[seed] connecting…');
  await connectDB();

  console.log('[seed] clearing collections…');
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Comment.deleteMany({}),
  ]);

  console.log('[seed] creating users…');
  const users = await Promise.all(
    userData.map((u) => User.create({ ...u, password: PASSWORD })),
  );
  const [admin, maya, marco, nora, sam, theo, ren] = users;

  console.log('[seed] creating projects…');
  const websiteRelaunch = await Project.create({
    name: 'Website Relaunch',
    description: 'Replatform the marketing site on Next.js with a refreshed brand system and new product pages.',
    owner: maya._id,
    members: [maya._id, nora._id, sam._id, theo._id, ren._id],
    status: 'active',
  });

  const mobileApp = await Project.create({
    name: 'Mobile App v2',
    description: 'Native rewrite of the iOS and Android apps to support offline mode and a redesigned task board.',
    owner: marco._id,
    members: [marco._id, theo._id, ren._id, nora._id],
    status: 'active',
  });

  const onboardingRevamp = await Project.create({
    name: 'Onboarding Revamp',
    description: 'Tighter signup flow, sample data, and a first-week checklist to drive activation.',
    owner: maya._id,
    members: [maya._id, sam._id, ren._id],
    status: 'active',
  });

  const archivedQ3 = await Project.create({
    name: 'Q3 Retrospective',
    description: 'Closed-out planning cycle from last quarter — kept around for reference.',
    owner: admin._id,
    members: [admin._id, maya._id, marco._id],
    status: 'archived',
  });

  console.log('[seed] creating tasks…');
  type T = {
    title: string;
    description: string;
    project: typeof websiteRelaunch._id;
    assignee?: typeof maya._id;
    createdBy: typeof maya._id;
    status: 'todo' | 'in_progress' | 'in_review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: Date;
    completedAt?: Date;
  };
  const tasksToCreate: T[] = [
    // Website Relaunch
    {
      title: 'Audit current sitemap',
      description: 'Catalog every page on the old site, flag what should migrate vs. retire.',
      project: websiteRelaunch._id,
      assignee: sam._id,
      createdBy: maya._id,
      status: 'done',
      priority: 'medium',
      dueDate: daysFromNow(-10),
      completedAt: daysFromNow(-9),
    },
    {
      title: 'Design new homepage hero',
      description: 'Hero with animated headline, primary CTA, social proof bar. Light + dark variants.',
      project: websiteRelaunch._id,
      assignee: theo._id,
      createdBy: maya._id,
      status: 'in_progress',
      priority: 'high',
      dueDate: daysFromNow(3),
    },
    {
      title: 'Pricing page restructure',
      description: 'Move to a 3-tier layout, add the new annual toggle and FAQ accordion.',
      project: websiteRelaunch._id,
      assignee: nora._id,
      createdBy: maya._id,
      status: 'in_review',
      priority: 'high',
      dueDate: daysFromNow(2),
    },
    {
      title: 'Migrate blog posts',
      description: 'Bring 124 posts over with redirects, alt text, and updated featured images.',
      project: websiteRelaunch._id,
      assignee: ren._id,
      createdBy: maya._id,
      status: 'todo',
      priority: 'medium',
      dueDate: daysFromNow(14),
    },
    {
      title: 'Set up CMS roles',
      description: 'Editor, contributor, admin. Document permissions in the playbook.',
      project: websiteRelaunch._id,
      assignee: sam._id,
      createdBy: maya._id,
      status: 'todo',
      priority: 'low',
      dueDate: daysFromNow(20),
    },
    {
      title: 'Performance budget gate',
      description: 'Add Lighthouse CI: LCP < 2.5s, CLS < 0.1. Fail PRs over budget.',
      project: websiteRelaunch._id,
      assignee: theo._id,
      createdBy: maya._id,
      status: 'in_progress',
      priority: 'urgent',
      dueDate: daysFromNow(-2),
    },
    {
      title: 'Cookie banner copy',
      description: 'Legal-approved consent banner copy in 4 languages.',
      project: websiteRelaunch._id,
      assignee: nora._id,
      createdBy: maya._id,
      status: 'todo',
      priority: 'medium',
      dueDate: daysFromNow(8),
    },
    {
      title: 'Launch checklist v1',
      description: 'DNS, redirects, analytics, search console, social card previews.',
      project: websiteRelaunch._id,
      assignee: maya._id,
      createdBy: maya._id,
      status: 'todo',
      priority: 'high',
      dueDate: daysFromNow(12),
    },

    // Mobile App v2
    {
      title: 'Offline-first sync engine',
      description: 'Local SQLite cache, conflict resolution strategy, retry queue.',
      project: mobileApp._id,
      assignee: theo._id,
      createdBy: marco._id,
      status: 'in_progress',
      priority: 'urgent',
      dueDate: daysFromNow(7),
    },
    {
      title: 'Task board drag-and-drop',
      description: 'Native gesture-based kanban with optimistic updates.',
      project: mobileApp._id,
      assignee: ren._id,
      createdBy: marco._id,
      status: 'todo',
      priority: 'high',
      dueDate: daysFromNow(10),
    },
    {
      title: 'Biometric login',
      description: 'Touch ID / Face ID on iOS, BiometricPrompt on Android.',
      project: mobileApp._id,
      assignee: nora._id,
      createdBy: marco._id,
      status: 'in_review',
      priority: 'high',
      dueDate: daysFromNow(1),
    },
    {
      title: 'Push notification refactor',
      description: 'Move to APNs + FCM v1, deduplicate quiet hours logic.',
      project: mobileApp._id,
      assignee: theo._id,
      createdBy: marco._id,
      status: 'done',
      priority: 'medium',
      dueDate: daysFromNow(-5),
      completedAt: daysFromNow(-3),
    },
    {
      title: 'Settings screen redesign',
      description: 'Match the new design system — sectioned list with clear hierarchy.',
      project: mobileApp._id,
      assignee: ren._id,
      createdBy: marco._id,
      status: 'todo',
      priority: 'low',
      dueDate: daysFromNow(18),
    },
    {
      title: 'Crash-free SLA',
      description: 'Drive crash-free sessions above 99.9% for the new build.',
      project: mobileApp._id,
      assignee: marco._id,
      createdBy: marco._id,
      status: 'in_progress',
      priority: 'urgent',
      dueDate: daysFromNow(-1),
    },

    // Onboarding Revamp
    {
      title: 'Reduce signup fields to 3',
      description: 'Name, email, password — defer the rest to the first-run tour.',
      project: onboardingRevamp._id,
      assignee: sam._id,
      createdBy: maya._id,
      status: 'done',
      priority: 'high',
      dueDate: daysFromNow(-7),
      completedAt: daysFromNow(-6),
    },
    {
      title: 'Sample workspace seeds',
      description: 'Auto-create a sample project with 5 tasks so new users land on a populated dashboard.',
      project: onboardingRevamp._id,
      assignee: ren._id,
      createdBy: maya._id,
      status: 'in_progress',
      priority: 'high',
      dueDate: daysFromNow(4),
    },
    {
      title: 'First-week checklist UI',
      description: 'Persistent collapsible checklist on the dashboard for the first 7 days.',
      project: onboardingRevamp._id,
      assignee: sam._id,
      createdBy: maya._id,
      status: 'todo',
      priority: 'medium',
      dueDate: daysFromNow(11),
    },
    {
      title: 'Activation event funnel',
      description: 'Define + instrument 5 activation events for the analytics dashboard.',
      project: onboardingRevamp._id,
      assignee: maya._id,
      createdBy: maya._id,
      status: 'in_review',
      priority: 'medium',
      dueDate: daysFromNow(0),
    },
  ];

  const tasks = await Task.insertMany(tasksToCreate);

  console.log('[seed] creating comments…');
  const t = (i: number) => tasks[i]._id;
  await Comment.insertMany([
    { task: t(1), author: maya._id, body: 'Pulling the lockup tonight — will share Figma link tomorrow.' },
    { task: t(1), author: theo._id, body: 'Should we A/B against the current hero before shipping?' },
    { task: t(2), author: nora._id, body: 'Annual toggle is wired, just polishing the transition.' },
    { task: t(5), author: theo._id, body: 'Lighthouse is at 78 mobile. Mostly CLS from the hero image — switching to AVIF.' },
    { task: t(5), author: maya._id, body: 'Nice — let me know when you want a review.' },
    { task: t(8), author: theo._id, body: 'Sync engine merged behind the `offline` flag. Tests in progress.' },
    { task: t(10), author: nora._id, body: 'Android side passes biometric, iOS prompts twice on first run. Investigating.' },
    { task: t(13), author: marco._id, body: 'Pushed two more crash fixes. Down to 99.86% on the latest build.' },
    { task: t(15), author: ren._id, body: 'Seed data PR open — please review when you get a chance.' },
    { task: t(17), author: maya._id, body: 'Funnel definition doc shared in #onboarding. Final 5 events listed.' },
  ]);

  console.log('[seed] done.');
  console.log('---');
  console.log('Demo credentials (password for all): ' + PASSWORD);
  for (const u of users) console.log(`  ${u.role.padEnd(8)} ${u.email}`);
  console.log('---');
  console.log('Archived project also seeded (id: ' + archivedQ3._id + ')');

  await disconnectDB();
}

run().catch(async (err) => {
  console.error('[seed] failed:', err);
  await disconnectDB().catch(() => undefined);
  process.exit(1);
});
