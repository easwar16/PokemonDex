import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="details/[name]"
        options={({ route }) => {
          const name = (route.params as { name?: string })?.name ?? '';
          const title = name
            ? name.charAt(0).toUpperCase() + name.slice(1)
            : 'Details';
          return {
            title,
            headerBackButtonDisplayMode: 'minimal',
            presentation: 'formSheet',
            sheetAllowedDetents: [0.3, 0.5, 0.7],
            sheetGrabberVisible: true,
          };
        }}
      />
    </Stack>
  );
}
