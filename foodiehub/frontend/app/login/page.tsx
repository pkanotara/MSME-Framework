export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-semibold mb-6">Login to FoodieHub</h1>
        <form className="space-y-4">
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Email" type="email" />
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Password" type="password" />
          <button className="w-full bg-indigo-600 text-white py-2 rounded-lg">Sign in</button>
        </form>
      </div>
    </main>
  );
}
