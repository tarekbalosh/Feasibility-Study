import { describe, it, expect } from "vitest";
import {
  type Actor,
  assertCanCreatePlanIn,
  canViewDepartment,
  departmentListWhere,
} from "../src/services/accessService";

const mkActor = (over: Partial<Actor>): Actor => ({
  userId: "u-default",
  workspaceId: "ws-1",
  memberId: "m-default",
  role: "member",
  isAdmin: false,
  canWrite: true,
  departmentIds: ["dep-a"],
  headOfDepartmentIds: [],
  planIds: [],
  ...over,
});

describe("صلاحيات إنشاء الخطط والأقسام (Department & Plan Permissions)", () => {
  const admin = mkActor({
    userId: "u-admin",
    memberId: "m-admin",
    role: "owner",
    isAdmin: true,
    departmentIds: ["dep-a", "dep-b", "dep-legacy"],
  });

  const headOfDepA = mkActor({
    userId: "u-headA",
    memberId: "m-headA",
    role: "member",
    departmentIds: ["dep-a"],
    headOfDepartmentIds: ["dep-a"],
  });

  const regularMember = mkActor({
    userId: "u-member",
    memberId: "m-member",
    role: "member",
    departmentIds: ["dep-a"],
    headOfDepartmentIds: [],
  });

  it("العضو العادي يرفض طلبه (403) عند محاولة إنشاء خطة في القسم", () => {
    expect(() => assertCanCreatePlanIn(regularMember, "dep-a")).toThrowError(
      /إنشاء الخطط متاح للمالك والمشرفين ورؤساء الأقسام فقط/
    );
  });

  it("مدير قسم أ يستطيع إنشاء خطة داخل قسمه (dep-a)", () => {
    expect(() => assertCanCreatePlanIn(headOfDepA, "dep-a")).not.toThrow();
  });

  it("مدير قسم أ لا يستطيع إنشاء خطة في قسم ب (dep-b) ويرجع خطأ صلاحيات", () => {
    expect(() => assertCanCreatePlanIn(headOfDepA, "dep-b")).toThrowError(
      /إنشاء الخطط متاح للمالك والمشرفين ورؤساء الأقسام فقط/
    );
  });

  it("المالك (owner/admin) يستطيع إنشاء خطة في كل الأقسام (dep-a و dep-b)", () => {
    expect(() => assertCanCreatePlanIn(admin, "dep-a")).not.toThrow();
    expect(() => assertCanCreatePlanIn(admin, "dep-b")).not.toThrow();
  });

  it("الأقسام القديمة بلا مدير: الصلاحية عليها تكون للمالك فقط ولا تنكسر", () => {
    // dep-legacy ليس له مدير في headOfDepartmentIds
    expect(() => assertCanCreatePlanIn(admin, "dep-legacy")).not.toThrow();
    expect(() => assertCanCreatePlanIn(regularMember, "dep-legacy")).toThrow();
    expect(() => assertCanCreatePlanIn(headOfDepA, "dep-legacy")).toThrow();
  });

  it("تغيير مدير القسم ينقل صلاحية إنشاء الخطة فوراً للمدير الجديد ويسحبها من القديم", () => {
    // مدير سابق بعد سحب المنصب منه:
    const exHead = mkActor({
      userId: "u-headA",
      memberId: "m-headA",
      departmentIds: ["dep-a"],
      headOfDepartmentIds: [], // تم سحب صفة رئيس القسم منه
    });

    // مدير جديد تم تعيينه:
    const newHead = mkActor({
      userId: "u-newHead",
      memberId: "m-newHead",
      departmentIds: ["dep-a"],
      headOfDepartmentIds: ["dep-a"], // أصبح رئيساً لقسم أ
    });

    // المدير السابق أصبح مرفوضاً
    expect(() => assertCanCreatePlanIn(exHead, "dep-a")).toThrow();
    // المدير الجديد مسموح له فوراً
    expect(() => assertCanCreatePlanIn(newHead, "dep-a")).not.toThrow();
  });

  it("عرض الأقسام: العضو يرى فقط الأقسام المصرّح له بها، والمالك يرى كل الأقسام", () => {
    const adminWhere = departmentListWhere(admin);
    expect(adminWhere).toEqual({ workspaceId: "ws-1" });

    const memberWhere = departmentListWhere(regularMember);
    expect(memberWhere).toEqual({
      workspaceId: "ws-1",
      id: { in: ["dep-a"] },
    });

    expect(canViewDepartment(regularMember, "dep-a")).toBe(true);
    expect(canViewDepartment(regularMember, "dep-b")).toBe(false);
  });
});
