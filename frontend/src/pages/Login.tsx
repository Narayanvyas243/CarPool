import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const isValidEmail = (email: string) => {
    return email.endsWith("@stu.upes.ac.in") || email.endsWith("@ddn.upes.ac.in");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please use your UPES college email (@stu.upes.ac.in or @ddn.upes.ac.in)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      toast({
        title: "Welcome back!",
        description: "Successfully logged in to UPES BlaBla",
      });

      login(data.user);
      navigate("/");
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-8 pb-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 shadow-elevated animate-fade-in">
          <span className="text-3xl font-bold text-primary-foreground">U</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-1 animate-fade-in">
          UPES BlaBla
        </h1>
        <p className="text-muted-foreground text-center mb-8 animate-fade-in">
          Share rides with fellow students & faculty
        </p>

        <div className="flex gap-6 mb-8 animate-fade-in">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="p-2 rounded-lg bg-primary/10">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <span>College Verified</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="p-2 rounded-lg bg-success/10">
              <Users className="h-4 w-4 text-success" />
            </div>
            <span>Safe Community</span>
          </div>
        </div>
      </div>

      {/* Login Card */}
      <Card className="mx-4 mb-8 shadow-elevated border-0 animate-fade-in">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl">Sign in to continue</CardTitle>
          <CardDescription>Use your UPES college email</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="your.name@stu.upes.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 bg-secondary border-0"
                  required
                />
              </div>
              {email && !isValidEmail(email) && (
                <p className="text-xs text-destructive px-1">
                  Please use your UPES email (@stu.upes.ac.in or @ddn.upes.ac.in)
                </p>
              )}
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 pr-11 h-12 bg-secondary border-0"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Button */}
            <Button
              type="submit"
              className="w-full h-12"
              size="lg"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <span className="animate-pulse">Signing in...</span>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-5 w-5 ml-1" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center pb-8 px-4">
        <p className="text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Login;