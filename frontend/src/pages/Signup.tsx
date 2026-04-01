import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, ArrowLeft, Phone, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const [step, setStep] = useState<"details" | "otp">("details");
  
  // Registration Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");

  const [otp, setOtp] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const isValidEmail = (email: string) => {
    return email.endsWith("@stu.upes.ac.in") || email.endsWith("@ddn.upes.ac.in");
  };

  const getUserRole = (email: string) => {
    if (email.endsWith("@ddn.upes.ac.in")) return "Faculty";
    if (email.endsWith("@stu.upes.ac.in")) return "Student";
    return null;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please use your UPES college email",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await fetch('/api/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, phone, gender })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      toast({
        title: "OTP Sent",
        description: data.message || "Please check your email for the OTP.",
      });
      setStep("otp");

    } catch (err: any) {
      toast({
        title: "Signup Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/users/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'OTP Verification failed');
      }

      toast({
        title: "Account Verified!",
        description: `Welcome to UPES BlaBla as ${getUserRole(email)}! Please sign in.`,
      });
      navigate("/login");

    } catch (err: any) {
      toast({
        title: "Verification Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Back Button */}
      <div className="p-4">
        <Button variant="ghost" size="sm" onClick={() => step === "otp" ? setStep("details") : navigate("/login")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col items-center px-4 pt-4 pb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-3 shadow-soft">
          <span className="text-2xl font-bold text-primary-foreground">U</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
        <p className="text-muted-foreground text-sm">Join the UPES ride-sharing community</p>
      </div>

      {/* Signup Card */}
      <Card className="mx-4 mb-8 shadow-elevated border-0 flex-1 animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{step === "details" ? "Your Details" : "Verify OTP"}</CardTitle>
          <CardDescription>
            {step === "details" ? "We'll auto-detect if you're a student or faculty" : `Enter the 6-digit code sent to ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          
          {step === "details" && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-[1.1rem] h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-11 h-12 bg-secondary border-0"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-[1.1rem] h-5 w-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="your.name@stu.upes.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 bg-secondary border-0"
                    required
                  />
                </div>
                {email && isValidEmail(email) && (
                  <div className="flex items-center gap-2 px-1">
                    <span className="verified-badge">
                      {getUserRole(email)}
                    </span>
                    <span className="text-xs text-success">Auto-detected role</span>
                  </div>
                )}
                {email && !isValidEmail(email) && (
                  <p className="text-xs text-destructive px-1">
                    Please use @stu.upes.ac.in or @ddn.upes.ac.in
                  </p>
                )}
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-[1.1rem] h-5 w-5 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="Contact Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-11 h-12 bg-secondary border-0"
                  required
                />
              </div>

              <div className="relative">
                <Select value={gender} onValueChange={setGender} required>
                  <SelectTrigger className="h-12 bg-secondary border-0">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-[1.1rem] h-5 w-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11 h-12 bg-secondary border-0"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[1.1rem] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-[1.1rem] h-5 w-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-11 h-12 bg-secondary border-0"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12" 
                size="lg"
                disabled={isLoading || !name || !email || !password || !confirmPassword || !phone || !gender}
              >
                {isLoading ? (
                  <span className="animate-pulse">Creating account...</span>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-5 w-5 ml-1" />
                  </>
                )}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="relative">
                <BadgeCheck className="absolute left-3 top-[1.1rem] h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="pl-11 h-12 bg-secondary border-0 text-lg tracking-widest text-center"
                  maxLength={6}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12" 
                size="lg"
                disabled={isLoading || otp.length < 6}
              >
                {isLoading ? (
                  <span className="animate-pulse">Verifying...</span>
                ) : (
                  <>
                    Verify OTP
                    <ArrowRight className="h-5 w-5 ml-1" />
                  </>
                )}
              </Button>
            </form>
          )}

          {step === "details" && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
