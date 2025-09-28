# A-Voice-Controlled-Web-Navigation-System

This is a Chrome extension that enables **hands-free web browsing** using voice commands.  
It supports navigation, tab management, media control, form filling, text reading, and more.
Here, **documents** directory contains latex, project ppt, pdf, sample video.

---

## 🚀 Installation (Load into Chrome)

1. Clone or download this repository.
2. Open **Google Chrome** and go to:
3. Navigate to **chrome://extensions/**.
4. Click **Load unpacked** and select the project folder.(without **documents** folder)
5. The extension icon will appear in your toolbar.
6. After reloading webpage, ask for **mic permission**. Allow it for accessing mic for every page.

You are now ready to use voice commands!

---

## 🎤 Available Features

The extension currently supports:

- Voice activation (`start listening`, `stop listening`)
- Scrolling and zooming
- Tab management
- Opening popular websites
- Google/YouTube search
- Media playback control
- Link interaction (show, hide, click links)
- Form filling via voice
- Reading selected text aloud
- Quick settings (Facebook/Gmail account options)

---

## 📊 Commands Table

| **Intent**                      | **Example Commands**                                  | **Category**                             |
| ------------------------------- | ----------------------------------------------------- | ---------------------------------------- | -------------- | --- |
| stop_listening / enable         | stop listening, start listening, voice off, voice on  | Voice Control                            |
| scroll_up / scroll_down         | scroll up, go down, move up, move down                | Scrolling                                |
| scroll_top / scroll_last        | scroll top, go to bottom                              | Scrolling                                |
| start_tabs / stop_tabs          | start tabs, stop tabs                                 | Tab Management                           |
| tab_next / tab_previous         | next tab, previous tab                                | Tab Management                           |
| tab_switch                      | change to \*                                          | Tab Management                           |
| tab_close / tab_display         | close tab, show tab                                   | Tab Management                           |
| open_site                       | open youtube, open gmail, open facebook, open new tab | Website Shortcuts                        |
| search                          | search cats, google latest news                       | Search                                   |
| start_media / stop_media        | start media, media stop                               | Media Control                            |
| media_play / media_pause        | play, pause, resume, stop video                       | Media Control                            |
| media_volume_up / down          | volume up, volume down                                | Media Control                            |
| media_volume_set                | volume 50 percent                                     | Media Control                            |
| media_mute / unmute             | mute, unmute                                          | Media Control                            |
| media_forward / backward        | forward 10 seconds, back 5 seconds                    | Media Control                            |
| show_links / hide_links         | show links, highlight links, hide links               | Link Interaction                         |
| click_link                      | click 2, click Login                                  | Link Interaction                         |
| zoom_in / zoom_out              | zoom in, zoom out                                     | Zoom                                     |
| zoom_reset                      | reset zoom, normal zoom                               | Zoom                                     |
| form_start / form_stop          | start form, exit form                                 | Form Fill-Up                             |
| form_next / form_back           | next, previous                                        | Form Fill-Up                             |
| form_clear_field                | clear                                                 | Form Fill-Up                             |
| form_go_to_field / index        | go to username, field 2                               | Form Fill-Up                             |
| form_select / form_show_options | select option 3, show options, list options           | Form Fill-Up                             |
| form_submit / form_remove_focus | submit form, off                                      | Form Fill-Up                             |
| reading_mode / stop_reading     | start reading, stop reading                           | Reading Mode                             |
| read_section                    | read section 2                                        | Reading Mode                             |
| read_faster / read_slower       | read faster, read slower                              | Reading Mode                             |
| read_speed_reset                | reset reading speed                                   | Reading Mode                             |
| toggle_lang                     | language, change language                             | Language Control                         |
| close_window                    | close window, cancel window                           | General Control                          |
| <!--                            | facebook/gmail quick actions                          | facebook password change, gmail settings | Quick Settings | --> |

---

## ⚠️ Limitations

- Works best in **Google Chrome (latest version)**.
- Requires **microphone access** for each site.
- Voice commands by Bangla language is supported only for few commands(will be updated soon...).
- Performance may vary based on background noise.
- Some sites with custom video players or dynamic content may not fully support media and link commands.

---

## 📂 References

Test results are stored in `test_results.json` / `test_results.txt`.  
These can be used to evaluate feature accuracy and response times.
