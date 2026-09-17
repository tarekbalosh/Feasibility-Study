import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

/**
 * حارس (Guard) للتحقق من مصادقة مدير النظام في الخادم.
 * يمكن تغليف أي دالة `getServerSideProps` في لوحة الإدارة بهذا الحارس.
 */
export function withAdminAuth<P extends { [key: string]: any }>(
  gssp?: GetServerSideProps<P>
): GetServerSideProps<P> {
  return async (context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
    const { admin_session } = context.req.cookies;

    // التحقق من وجود وتطابق كعكة جلسة المدير
    if (!admin_session || admin_session !== 'authenticated') {
      return {
        redirect: {
          destination: '/admin',
          permanent: false,
        },
      };
    }

    // إذا وُجدت دالة gssp أخرى ممررة، قم بتنفيذها
    if (gssp) {
      return await gssp(context);
    }

    // افتراضياً، إرجاع خصائص فارغة
    return {
      props: {} as P,
    };
  };
}
