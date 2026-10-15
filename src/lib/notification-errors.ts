type NotificationQueryError = {
  code?: string | null;
  message?: string | null;
};

export function isNotificationsTableMissing(error: NotificationQueryError) {
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("Could not find the table 'public.user_notifications' in the schema cache") === true ||
    error.message?.includes('relation "public.user_notifications" does not exist') === true
  );
}
