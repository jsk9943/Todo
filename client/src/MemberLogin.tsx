import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { AiOutlineCloseCircle } from 'react-icons/ai'
import './MemberLogin.scss';

type signup = {
    signupId: string;
    signupPw: string;
}

const MemberLogin = () => {
    const [, setCookie] = useCookies(['token']);
    const [modalDisappear, setModalDisappear] = useState<boolean>(false);
    const [singupModalOpen, setSignupModalOpen] = useState<boolean>(false);
    const [loginID, setLoginID] = useState<string>('');
    const [loginPW, setLoginPW] = useState<string>('');
    const saveIDRef = useRef<string>('');
    const signupIDRef = useRef<string>('');
    const signupPWRef = useRef<string>('');
    const signupRePWRef = useRef<string>('');
    const idValidationMessageRef = useRef<string | boolean | null>(null);
    const PwValidationMessageRef = useRef<string | boolean | null>(null);
    const [idValidationMessage, setIdValidationMessage] = useState<string | null | boolean>(null);
    const [PwValidationMessage, setPwValidationMessage] = useState<string | null | boolean>(null);
    const navigate = useNavigate();

    //아이디 저장 시 로컬스토리지 저장
    useEffect(() => {
        saveIDRef.current = localStorage.getItem('loginID');
        const savedLoginIDCheckbox = localStorage.getItem('loginIDCheckbox');
        if (savedLoginIDCheckbox === 'true') {
            const inputElement = document.querySelector("#saveID") as HTMLInputElement;
            if (inputElement) {
                inputElement.value = saveIDRef.current;
                setLoginID(saveIDRef.current);
            }
            const rememberCheckbox = document.getElementById('save-checkbox') as HTMLInputElement;
            rememberCheckbox.checked = true;
        }
    }, []);

    //아이디 엔터
    const handleLoginIDKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            document.getElementById('password-input')?.focus();
        }
    }

    //비밀번호 엔터
    const handleLoginPWkeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            await loginConfirm();
        }
    }

    //로그인 기능
    const loginConfirm = async () => {
        if (!loginID) {
            alert('아이디를 확인해주세요');
            return;
        } else if (!loginPW) {
            alert('비밀번호를 확인해주세요');
            return;
        }
        const jsonData = {
            loginID,
            loginPW
        }
        try {
            const response = await axios.post(`${process.env.REACT_APP_SERVER}/userLogin`, jsonData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            if (response.data === "ID_INCORRECT") {
                alert('아이디가 존재하지 않습니다');
                return;
            }
            if (response.data === "PW_INCORRECT") {
                alert('비밀번호가 틀렸습니다');
                return;
            } else {
                const rememberCheckbox = document.getElementById('save-checkbox') as HTMLInputElement;
                const rememberCheckboxState = rememberCheckbox.checked;
                if (rememberCheckboxState) {
                    localStorage.setItem('loginID', loginID);
                    localStorage.setItem('loginIDCheckbox', rememberCheckboxState.toString());
                }
                const token = {
                    loginID,
                    token: response.data.randomToken
                }
                setCookie('token', token, { path: '/' });
                navigate('/todo.do');
            }
        } catch (error) {
            alert(error);
        }
    };
    //회원가입 버튼
    const signupBtnClick = (): void => {
        setModalDisappear(true);
        setSignupModalOpen(true);
    }
    //모달 내 클릭버튼
    const modalCloseBtnClick = (): void => {
        setModalDisappear(false)
        setTimeout(() => {
            setSignupModalOpen(false);
        }, 500)
    }
    //실시간 아이디 중복여부 체크
    const signupIdValidation = async (): Promise<void> => {
        const koreanRegex = /[ㄱ-ㅎㅏ-ㅣ가-힣]/;
        if (signupIDRef.current.trim()) {
            if (signupIDRef.current.length > 10) {
                idValidationMessageRef.current = '아이디는 10자를 초과할 수 없습니다';
                setIdValidationMessage(idValidationMessageRef.current);
            } else if (koreanRegex.test(signupIDRef.current)) {
                idValidationMessageRef.current = '한글은 사용할 수 없습니다';
                setIdValidationMessage(idValidationMessageRef.current);
            } else {
                const result = await axios.get(`${process.env.REACT_APP_SERVER}/signup?signupId=${signupIDRef.current}`);
                if (result.data === false) {
                    idValidationMessageRef.current = true;
                    setIdValidationMessage(idValidationMessageRef.current);
                } else {
                    idValidationMessageRef.current = '사용 할 수 없는 아이디 입니다';
                    setIdValidationMessage(idValidationMessageRef.current);
                }
            }
        } else {
            idValidationMessageRef.current = null;
            setIdValidationMessage(null);
        }
    }
    //비밀번호 일치 및 사용가능여부 체크
    const signupPwValidation = async () => {
        if (signupPWRef.current.trim() && signupRePWRef.current.trim()) {
            if (signupPWRef.current !== signupRePWRef.current) {
                PwValidationMessageRef.current = '비밀번호가 일치하지 않습니다';
                setPwValidationMessage(PwValidationMessageRef.current);
            } else if (signupPWRef.current.length > 15) {
                PwValidationMessageRef.current = '비밀번호는 15자를 초과 할 수 없습니다';
                setPwValidationMessage(PwValidationMessageRef.current);
            } else if (signupRePWRef.current.length > 15) {
                PwValidationMessageRef.current = '비밀번호는 15자를 초과 할 수 없습니다';
                setPwValidationMessage(PwValidationMessageRef.current);
            } else {
                PwValidationMessageRef.current = true;
                setPwValidationMessage(PwValidationMessageRef.current);
            }
        } else {
            PwValidationMessageRef.current = null;
            setPwValidationMessage(PwValidationMessageRef.current);
        }
    }
    // 가입처리
    const signup = async () => {
        const signupData: signup = {
            signupId: signupIDRef.current,
            signupPw: signupPWRef.current
        }
        const response = await axios.post(`${process.env.REACT_APP_SERVER}/signup`, signupData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (response.statusText === 'OK') {
            alert('가입이 완료 되었습니다');
            setModalDisappear(false)
            setTimeout(() => {
                setSignupModalOpen(false);
            }, 500)
            return;
        }
    }

    return (
        <section>
            <div className='login-container'>
                <div className='loginTitle'>
                    <span>환영합니다</span>
                </div>
                <div className="loginID">
                    <div>ID</div>
                    <input
                        id='saveID'
                        type='text'
                        onChange={(e) => { setLoginID(e.target.value) }}
                        onKeyDown={(e) => { handleLoginIDKeyPress(e); }}
                    />
                </div>
                <div className="loginPW">
                    <div>Password</div>
                    <input
                        id="password-input"
                        type='password'
                        onChange={(e) => { setLoginPW(e.target.value); }}
                        onKeyDown={(e) => { handleLoginPWkeyPress(e); }}
                    />
                </div>
                <div className="saveID">
                    <input
                        type="checkbox"
                        id="save-checkbox"
                        onChange={(e) => {
                            if (e.target.checked) {
                                localStorage.setItem("loginIDCheckbox", e.target.checked.toString());
                            } else {
                                const inputElement = document.querySelector("#saveID") as HTMLInputElement;
                                if (inputElement) {
                                    inputElement.value = '';
                                    setLoginID('');
                                }
                                localStorage.setItem("loginIDCheckbox", '');
                                localStorage.setItem("loginID", '');
                            }
                        }} />
                    <label htmlFor="save-checkbox">아이디 저장</label>
                </div>
                <div className="buttonContainer">
                    <button type="button" onClick={() => { loginConfirm(); }}>LOGIN</button>
                    <button type="button" onClick={() => { signupBtnClick(); }}>SIGN UP</button>
                </div>
            </div>
            {singupModalOpen && (
                <div className={modalDisappear ? 'signupModal-active' : 'signupModal-disappear'}>
                    <div className='modal-container'>
                        <div className='closeModal'>
                            <span>Sign Up</span>
                            <AiOutlineCloseCircle
                                size={30}
                                onClick={() => { modalCloseBtnClick() }}
                            />
                        </div>
                        <div className='modal-id-container'>
                            <div>ID</div>
                            <input type='text' placeholder='Enter ID' onChange={(e) => { signupIDRef.current = e.target.value; signupIdValidation(); }} />
                            {idValidationMessage &&
                                <div
                                    className={`id-validation ${idValidationMessage === true ? 'blue-text' : ''}`}>
                                    {idValidationMessage === true ? '사용 가능 한 아이디 입니다' : idValidationMessage}
                                </div>
                            }
                        </div>
                        <div className='modal-pw-container'>
                            <div>Password</div>
                            <input type='password' placeholder='Enter Password' onChange={(e) => { signupPWRef.current = e.target.value; signupPwValidation(); }} />
                            <br />
                            <input type='password' placeholder='Re-enter password' onChange={(e) => { signupRePWRef.current = e.target.value; signupPwValidation(); }} />
                            {PwValidationMessage &&
                                <div
                                    className={`pw-validation ${PwValidationMessage === true ? 'blue-text' : ''}`}>
                                    {PwValidationMessage === true ? '사용 가능한 비밀번호 입니다' : PwValidationMessage}
                                </div>
                            }
                        </div>
                        <div className='modal-btn-container'>
                            <button
                                className={idValidationMessageRef.current === true && PwValidationMessageRef.current === true ? 'btnTurnOn' : 'btnTurnOff'}
                                disabled={idValidationMessageRef.current !== true || PwValidationMessageRef.current !== true}
                                onClick={() => { signup(); }}>
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default MemberLogin;