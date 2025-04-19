import streamlit as st
from dotenv import load_dotenv
from workflow import run_workflow, FarmerState

load_dotenv()   

st.set_page_config(page_title="Agricultural Subsidy Advisor", page_icon="🌾", layout="wide")

st.title("🌾 Smart Subsidy Advisor")
st.markdown("""
    Enter your farm details to get personalized subsidy recommendations with eligibility, benefits, and steps to apply.
    Outsmarting Subsidy4India with real-time insights!
""")

st.sidebar.header("Your Farm Details")
with st.sidebar.form(key="farmer_form"):
    st.markdown("**Required Fields**")
    district = st.text_input("District *", value="Pune", help="E.g., Pune")
    state = st.text_input("State *", value="Maharashtra", help="E.g., Maharashtra")
    land_size = st.text_input("Land Size (e.g., 2 hectares) *", value="2 hectares", help="Include units")
    crop_type = st.text_input("Crop Type (e.g., wheat) *", value="wheat", help="Main crop")

    st.markdown("**Optional Fields** (More details = Better results)")
    village = st.text_input("Village", value="", help="For local schemes")
    ownership = st.selectbox("Land Ownership", ["Owned", "Leased"], index=0)
    irrigation = st.selectbox("Irrigation", ["Irrigated", "Rain-fed"], index=1)
    income = st.text_input("Annual Income (e.g., 150000)", value="150000", help="In rupees")
    caste_category = st.selectbox("Caste Category", ["General", "OBC", "SC", "ST"], index=0)
    bank_account = st.selectbox("Bank Account?", ["Yes", "No"], index=0)
    existing_schemes = st.text_input("Current Schemes (if any, else 'none')", value="none")

    submit_button = st.form_submit_button(label="Get Recommendations")

if submit_button:
    if not all([district, state, land_size, crop_type]):
        st.error("Please fill all required fields (marked with *)!")
    else:
        with st.spinner("Analyzing your farm and fetching subsidies..."):
            initial_state: FarmerState = {
                "profile": {
                    "village": village,
                    "district": district,
                    "state": state,
                    "land_size": land_size,
                    "land_ownership": ownership.lower(),
                    "crop_type": crop_type,
                    "irrigation": irrigation.lower(),
                    "income": income,
                    "caste_category": caste_category.lower(),
                    "bank_account": bank_account.lower(),
                    "existing_schemes": existing_schemes.lower()
                },
                "schemes": [],
                "recommendations": None,
                "refinement_needed": False,
                "feedback": None,
                "visuals": []
            }

            try:
                result = run_workflow(initial_state)
                st.subheader("Your Personalized Scheme Recommendations")

                sections = result["recommendations"].split("##")[1:]
                for section in sections:
                    if section.strip():
                        title = section.split("\n")[0].strip()
                        content = "\n".join(section.split("\n")[1:]).strip()
                        with st.expander(f"🌟 {title}", expanded=True):
                            st.markdown(content)
                            if st.button("Not Useful", key=title):
                                initial_state["feedback"] = f"Not useful: {title}"
                                result = run_workflow(initial_state)
                                st.rerun() 

                if result["visuals"]:
                    st.image(f"data:image/png;base64,{result['visuals'][0]}", caption="Subsidy Breakdown")
                
                st.info("Tip: Add your village or update details for more tailored suggestions!")
            except Exception as e:
                st.error(f"An error occurred: {str(e)}")
                st.write("Check your inputs or API keys and try again.")
