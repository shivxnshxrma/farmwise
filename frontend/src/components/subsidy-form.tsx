import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
// import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import axios from "axios";
import MDEditor from "@uiw/react-md-editor";

// Zod schema for form validation
const formSchema = z.object({
  district: z.string().min(1, "District is required"),
  state: z.string().min(1, "State is required"),
  landSize: z.string().min(1, "Land size is required"),
  cropType: z.string().min(1, "Crop type is required"),
  village: z.string().optional(),
  ownership: z.enum(["Owned", "Leased"]),
  irrigation: z.enum(["Irrigated", "Rain-fed"]),
  income: z.string().optional(),
  casteCategory: z.enum(["General", "OBC", "SC", "ST"]),
  bankAccount: z.enum(["Yes", "No"]),
  existingSchemes: z.string().optional(),
  feedback: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AgriculturalSubsidyForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [visuals, setVisuals] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("form");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      district: "",
      state: "",
      landSize: "",
      cropType: "",
      village: "",
      ownership: "Owned",
      irrigation: "Rain-fed",
      income: "",
      casteCategory: "General",
      bankAccount: "Yes",
      existingSchemes: "none",
      feedback: "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      setIsLoading(true);

      const requestData = {
        profile: {
          district: values.district,
          state: values.state,
          land_size: values.landSize,
          crop_type: values.cropType,
          village: values.village,
          ownership: values.ownership.toLowerCase(),
          irrigation: values.irrigation.toLowerCase(),
          income: values.income || "0",
          caste_category: values.casteCategory.toLowerCase(),
          bank_account: values.bankAccount.toLowerCase(),
          existing_schemes: values.existingSchemes?.toLowerCase() || "none",
        },
        feedback: values.feedback || null,
      };

      const res = await axios.post(
        "http://localhost:8000/api/recommendations",
        requestData
      );
      setRecommendations(res.data.data);
      setVisuals(res.data.data.visuals);
    } catch (error) {
      console.error("ERROR[SUBSIDY]:", error);
      //   toast({
      //     title: "Error",
      //     description: error instanceof Error ? error.message : "An error occurred",
      //     variant: "destructive",
      //   });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Agricultural Subsidy Finder
        </h1>
        <p className="text-muted-foreground mt-2">
          Find personalized subsidy schemes for your farm based on your profile
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-8 w-full max-w-md mx-auto">
          <TabsTrigger value="form">Farm Profile</TabsTrigger>
          <TabsTrigger value="results" disabled={!recommendations}>
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-primary text-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm">
                  1
                </span>
                Enter Your Farm Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information Card */}
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Badge variant="outline" className="py-1">
                          Required
                        </Badge>
                        Basic Information
                      </h3>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="E.g., Maharashtra"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="district"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>District</FormLabel>
                              <FormControl>
                                <Input placeholder="E.g., Pune" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="village"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Village (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="E.g., Kothrud" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Farm Information Card */}
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Badge variant="outline" className="py-1">
                          Required
                        </Badge>
                        Farm Information
                      </h3>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="landSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Land Size</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="E.g., 2 hectares"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Include units (acres/hectares)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="cropType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Main Crop</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="E.g., wheat, rice"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Additional Details Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Land & Irrigation</h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="ownership"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Land Ownership</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select ownership" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Owned">Owned</SelectItem>
                                  <SelectItem value="Leased">Leased</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="irrigation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Irrigation Type</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Irrigated">
                                    Irrigated
                                  </SelectItem>
                                  <SelectItem value="Rain-fed">
                                    Rain-fed
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Personal Details</h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="casteCategory"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Caste Category</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="General">
                                    General
                                  </SelectItem>
                                  <SelectItem value="OBC">OBC</SelectItem>
                                  <SelectItem value="SC">SC</SelectItem>
                                  <SelectItem value="ST">ST</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="bankAccount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bank Account</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select option" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Yes">Yes</SelectItem>
                                  <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="income"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Annual Income (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g., 150000" {...field} />
                          </FormControl>
                          <FormDescription>
                            In rupees (for income-based schemes)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="existingSchemes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Schemes (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="E.g., PM-KISAN or 'none'"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {recommendations && (
                    <FormField
                      control={form.control}
                      name="feedback"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Feedback for Refinement</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Any feedback to improve recommendations?"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Leave blank if you're satisfied with current
                            recommendations
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isLoading}
                      className="w-full sm:w-auto"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : recommendations ? (
                        <>
                          Refine Recommendations
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Get Recommendations
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          {recommendations ? (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Your Farm Profile Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        Farmer Type
                      </h4>
                      <p className="text-lg font-semibold capitalize">
                        {recommendations.profile.farmer_type || "Unknown"}
                      </p>
                    </div>
                    {/* <div className="p-4 bg-muted rounded-lg">
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        Insurance Need
                      </h4>
                      <p className="text-lg font-semibold capitalize">
                        {recommendations.profile.needs_insurance === "high" ? (
                          <span className="flex items-center text-amber-600">
                            <AlertCircle className="mr-1 h-4 w-4" />
                            High Priority
                          </span>
                        ) : recommendations.profile.needs_insurance ===
                          "medium" ? (
                          <span className="flex items-center text-amber-500">
                            Medium
                          </span>
                        ) : recommendations.profile.needs_insurance ===
                          "low" ? (
                          <span className="flex items-center text-green-600">
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Low Priority
                          </span>
                        ) : (
                          "Unknown"
                        )}
                      </p>
                    </div> */}
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        Seed Cost Estimate
                      </h4>
                      <p className="text-lg font-semibold">
                        ₹
                        {recommendations.profile.seed_cost_estimate ||
                          "Unknown"}{" "}
                        <span className="text-sm font-normal">/hectare</span>
                      </p>
                    </div>
                  </div>

                  {/* {visuals.length > 0 && (
                    <div className="mt-6 p-4 bg-background border rounded-lg">
                      <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
                        Subsidy Breakdown
                      </h3>
                      <img
                        src={`data:image/png;base64,${visuals[0]}`}
                        alt="Subsidy Breakdown"
                        className="max-h-64 mx-auto"
                      />
                    </div>
                  )} */}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <span className="bg-green-100 text-green-700 p-1 rounded-full mr-2">
                        <CheckCircle2 className="h-5 w-5" />
                      </span>
                      Available Schemes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recommendations.schemes.map(
                        (scheme: any, index: number) => (
                          <div
                            key={index}
                            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <h4 className="font-medium text-base">
                              {scheme.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {scheme.summary}
                            </p>
                            {scheme.url && (
                              <a
                                href={scheme.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary text-sm mt-2 inline-flex items-center"
                              >
                                Visit official site
                                <ArrowRight className="ml-1 h-3 w-3" />
                              </a>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Personalized Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MDEditor.Markdown
                      source={recommendations.recommendations}
                      style={{ background: "transparent", color: "black" }}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <Button variant="outline" onClick={() => setActiveTab("form")}>
                  Edit Farm Profile
                </Button>

                <Button>Download All Recommendations</Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    Submit your farm details to get personalized subsidy
                    recommendations
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
