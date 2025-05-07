import { Button, CssVarsProvider, Sheet } from "@mui/joy";
import Image from "next/image";
import PageLayout from "../../components/PageLayout";

export default function AppPage() {
    function Divider() {
        return <div style={{background:'#333339',width:'100%',maxWidth:'600px',height:'2px',margin:'15px 0'}}></div>
    }
    function Gap(props: any) {
        return <div style={{height:props.height||15}}></div>
    }
    function FAI(icon: string) {
        return <i className={`fa-solid fa-${icon}`}></i>
    }
    return (
        <PageLayout>
            <div style={{width:'100%',display:'flex',textAlign:'center',
                         alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
                <Gap />
                <span style={{fontSize:'2rem',fontWeight:'700'}}>iOS App</span>
                <span>Movieslay for iOS can only be installed through a third-party app named ESign.</span>
                <span>Make sure to view this page <b>using Safari</b> on iOS.</span>
                <Divider />
                <b>1. Khoindvn DNS profile</b>
                <span>Click the button below to install the DNS profile required</span>
                <span>to prevent Apple from revoking (uninstalling) the app.</span>
                <Gap />
                <Button startDecorator={FAI("screwdriver-wrench")} href="https://github.com/esigncert/khoindvn/raw/refs/heads/main/document/DNS/khoindns.mobileconfig" component={"a"}>Install DNS Profile</Button>
                <Gap />
                <span>Once opened, open the <b>Settings</b> app and navigate to:</span>
                <span>General &gt; VPN, DNS, Device Management</span>
                <span>to install the downloaded DNS profile.</span>
                <Divider /> 
                <b>2. Download Certificates</b>
                <span>The button below will <b>download</b> a .zip file on your</span>
                <span>device. Once downloaded, open the <b>Files</b> app</span>
                <span>and click on the downloaded .zip to extract it's contents.</span>
                
                <Gap />
                <Button startDecorator={FAI("download")} download={"Esign-Certs.zip"} href="https://khoindvn.io.vn/document/DNS/Esign-Certs.zip" component={"a"}>Download Certs</Button>
                <Divider />
                <b>3. Download Movieslay (IPA)</b>
                <span>The next button will download the Movieslay app as an .ipa file.</span>
                <Gap />
                <Button startDecorator={FAI("download")} download={"Movieslay.ipa"} href="/app/Movieslay.ipa" component={"a"}>Download IPA</Button>
                <Divider />
                <b>4. Install ESign</b>
                <span>Head to the Khoindvn page, and scroll past the app mods to Esign.</span>
                <span>Click the download button on one of the apps.</span>
                <span>Check the home screen and make sure the app installed, even if it</span>
                <span>is unable to open. If it gives a "Network Required" message,</span>
                <span>try a different Esign from the website.</span>
                <Gap />
                <Button startDecorator={FAI("arrow-up-right-from-square")} href="https://khoindvn.io.vn/" component={"a"}>Go to Khoindvn</Button>
                <Gap />
                <span>Once installed, make the app run by going back to</span>
                <span>General &gt; VPN, DNS, Device Management</span>
                <span>and finding the certificate that is unreviewed, before</span>
                <span>opening it and clicking "allow". Your device may reboot.</span>
                <Divider />
                <b>5. Setting up ESign</b>
                <span>Now that ESign is installed, open the app and</span>
                <span>agree to the terms of service. Once done, click in the</span>
                <span>top right menu and "Import" a file.</span>
                <Gap />
                <span>The file to import should be in the Esign-Certs folder</span>
                <span>and correspond to the app version you installed.</span>
                <span>Once imported, select the certificate and click "Import Certificate Management".</span>
                <Gap />
                <span>Next, click in the top right and click "Import" again.</span>
                <span>This time, select the Movieslay.ipa file from before.</span>
                <span>Do not click on the IPA once inside Esign.</span>
                <Divider />
                <b>6. Installing Movieslay</b>
                <span>Go to the "Apps" tab, and under "Unsigned" click on Movieslay.</span>
                <span>Click <b>Signature</b>, and then <b>Signatue</b> again.</span>
                <Gap />
                <span>Once done with the process, click <b>Install</b> at the bottom.</span>
                <span>Click Install on the popup, and close ESign.</span>
                <b>You should now have the Movieslay app.</b>
                <Gap />
                <b>Notes</b>
                <span>The app won't automatically update, and you'll have to keep ESign installed</span>
                <span>but you can remove it from your home screen.</span>
            </div>
        </PageLayout>
    );
}