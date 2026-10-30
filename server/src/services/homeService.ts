import { prisma } from "../config/prisma";
import {
  type Actor,
  departmentListWhere,
  planListWhere,
  projectListWhere,
} from "./accessService";
import { memberSelect } from "./orgHelpers";
import { buildHomeDashboard, type SwotGoalInput } from "./homeBuilder";

/**
 * خدمة جلب بيانات الصفحة الرئيسية من قاعدة البيانات وتمريرها للمنشئ
 */
export async function getHomeDashboard(actor: Actor) {
  const currentMember = await prisma.workspaceMember.findUnique({
    where: { id: actor.memberId },
    select: {
      id: true,
      email: true,
      role: true,
      user: { select: { id: true, name: true } },
    },
  });

  const [departments, plans, projectsCount, recentProjects, wsMembersCount, wsMembers, visibleMembers] =
    await Promise.all([
      prisma.department.findMany({
        where: departmentListWhere(actor),
        select: {
          id: true,
          name: true,
          color: true,
          icon: true,
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.plan.findMany({
        where: planListWhere(actor),
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          endDate: true,
          departmentId: true,
          department: { select: { id: true, name: true, color: true, icon: true } },
          members: {
            take: 5,
            select: { workspaceMember: { select: memberSelect } },
          },
          _count: { select: { members: true, goals: true } },
          tasks: { select: { weight: true, progress: true, status: true, dueDate: true } },
        },
      }),
      prisma.toolRun.count({ where: projectListWhere(actor) }),
      prisma.toolRun.findMany({
        where: projectListWhere(actor),
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          toolSlug: true,
          updatedAt: true,
          user: { select: { id: true, name: true } },
          department: { select: { id: true, name: true, color: true } },
          plan: { select: { id: true, name: true } },
        },
      }),
      prisma.workspaceMember.count({ where: { workspaceId: actor.workspaceId, status: "active" } }),
      prisma.workspaceMember.findMany({
        where: { workspaceId: actor.workspaceId },
        select: memberSelect,
      }),
      // الأعضاء المسموح برؤيتهم: المدير الكل، غيره أعضاء أقسامه ونفسه
      prisma.workspaceMember.findMany({
        where: {
          workspaceId: actor.workspaceId,
          status: "active",
          ...(actor.isAdmin
            ? {}
            : {
                OR: [
                  { id: actor.memberId },
                  { departmentMemberships: { some: { departmentId: { in: actor.departmentIds } } } },
                ],
              }),
        },
        select: memberSelect,
        orderBy: { joinedAt: "asc" },
      }),
    ]);

  // استعلام الأهداف والمهام المصرح بها
  const goalsWithTasks = await prisma.swotCustomGoal.findMany({
    where: {
      toolRun: actor.isAdmin
        ? { workspaceId: actor.workspaceId }
        : projectListWhere(actor),
    },
    include: {
      tasks: {
        orderBy: { dueDate: "asc" },
      },
      toolRun: {
        select: {
          id: true,
          title: true,
          departmentId: true,
          planId: true,
        },
      },
    },
  });

  return buildHomeDashboard({
    actor,
    currentMember,
    departments,
    plans,
    projectsCount,
    recentProjects,
    wsMembersCount,
    wsMembers,
    goals: goalsWithTasks as unknown as SwotGoalInput[],
    visibleMembers,
  });
}
