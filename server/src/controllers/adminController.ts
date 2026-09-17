import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";

const getPagination = (req: Request) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
};

const createAuditLog = async (adminId: string, action: string, targetType: string, targetId: string | null = null, metadata: any = null) => {
  await prisma.auditLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
};

export const getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalUsers,
      totalWorkspaces,
      totalProjects,
      totalToolRuns,
      successfulPayments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.workspace.count(),
      prisma.project.count(),
      prisma.toolRun.count(),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: "paid" }, // Assuming 'paid' is the success status
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalWorkspaces,
        totalProjects,
        totalToolRuns,
        revenue: successfulPayments._sum.amount || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPagination(req);
    const search = req.query.search as string;
    
    const where = search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          subscriptionTier: true,
          createdAt: true,
          _count: {
            select: {
              ownedWorkspaces: true,
              projects: true,
              toolRuns: true,
            }
          }
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        subscriptionTier: true,
        isVerified: true,
        createdAt: true,
        userLimit: true,
        _count: {
          select: {
            ownedWorkspaces: true,
            projects: true,
            toolRuns: true,
            payments: true,
          }
        }
      },
    });

    if (!user) {
      throw ApiError.notFound("المستخدم غير موجود.");
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "suspended"].includes(status)) {
      throw ApiError.badRequest("حالة غير صالحة.");
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, name: true, status: true },
    });

    await createAuditLog("SYSTEM_ADMIN", "UPDATE_USER_STATUS", "User", id, { status });

    res.json({ success: true, data: user, message: "تم تحديث حالة المستخدم بنجاح." });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaces = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPagination(req);
    const search = req.query.search as string;
    
    const where = search ? {
      name: { contains: search, mode: "insensitive" as const },
    } : {};

    const [workspaces, total] = await Promise.all([
      prisma.workspace.findMany({
        where,
        skip,
        take,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { members: true, toolRuns: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.workspace.count({ where }),
    ]);

    res.json({
      success: true,
      data: workspaces,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        _count: { select: { toolRuns: true } },
      },
    });

    if (!workspace) {
      throw ApiError.notFound("مساحة العمل غير موجودة.");
    }

    res.json({ success: true, data: workspace });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPagination(req);
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        skip,
        take,
        select: {
          id: true,
          name: true,
          industry: true,
          location: true,
          targetCapital: true,
          currency: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.project.count(),
    ]);

    res.json({
      success: true,
      data: projects,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getTools = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Group tool runs by toolSlug to get aggregate usage statistics
    const toolStats = await prisma.toolRun.groupBy({
      by: ["toolSlug"],
      _count: { id: true },
      _min: { createdAt: true },
      _max: { createdAt: true },
    });

    res.json({ success: true, data: toolStats });
  } catch (error) {
    next(error);
  }
};

export const getToolRuns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPagination(req);
    const [runs, total] = await Promise.all([
      prisma.toolRun.findMany({
        skip,
        take,
        select: {
          id: true,
          toolSlug: true,
          title: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
          workspace: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.toolRun.count(),
    ]);

    res.json({
      success: true,
      data: runs,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPagination(req);
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        skip,
        take,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.count(),
    ]);

    res.json({
      success: true,
      data: payments,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getLimits = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPagination(req);
    const [limits, total] = await Promise.all([
      prisma.userLimit.findMany({
        skip,
        take,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { resetAt: "asc" },
      }),
      prisma.userLimit.count(),
    ]);

    res.json({
      success: true,
      data: limits,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { generationsLimit, generationsUsed } = req.body;

    const limit = await prisma.userLimit.update({
      where: { userId },
      data: {
        generationsLimit: generationsLimit !== undefined ? generationsLimit : undefined,
        generationsUsed: generationsUsed !== undefined ? generationsUsed : undefined,
      },
    });

    await createAuditLog("SYSTEM_ADMIN", "UPDATE_USER_LIMIT", "UserLimit", userId, { generationsLimit, generationsUsed });

    res.json({ success: true, data: limit, message: "تم تحديث حدود المستخدم بنجاح." });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPagination(req);
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count(),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};
